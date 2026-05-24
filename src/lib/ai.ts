import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import type { UserSettings } from './types'
import { decrypt } from './crypto'

type DocumentType = 'cover_letter' | 'tailored_cv'

function buildOpenAIClient(settings: UserSettings) {
  const apiKey = settings.ai_provider === 'openai' && settings.openai_api_key_enc
    ? decrypt(settings.openai_api_key_enc)
    : 'ollama'
  return new OpenAI({
    apiKey,
    baseURL: settings.ai_provider === 'ollama' ? settings.ai_base_url : undefined,
  })
}

async function chatOpenAI(settings: UserSettings, prompt: string): Promise<string> {
  const client = buildOpenAIClient(settings)
  const res = await client.chat.completions.create({
    model: settings.ai_model || (settings.ai_provider === 'openai' ? 'gpt-4o-mini' : 'llama3'),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  })
  return res.choices[0]?.message?.content ?? ''
}

async function chatClaude(settings: UserSettings, prompt: string): Promise<string> {
  const apiKey = settings.claude_api_key_enc ? decrypt(settings.claude_api_key_enc) : ''
  const client = new Anthropic({ apiKey })
  const res = await client.messages.create({
    model: settings.ai_model || 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  return (res.content[0] as { text: string }).text ?? ''
}

async function chat(settings: UserSettings, prompt: string): Promise<string> {
  if (settings.ai_provider === 'claude') return chatClaude(settings, prompt)
  return chatOpenAI(settings, prompt)
}

export async function scoreMatch(
  cvText: string,
  jobDescription: string,
  settings: UserSettings,
): Promise<number | null> {
  try {
    const prompt = `Score how well this CV matches this job description.\nReturn JSON only: { "score": <integer 0-100> }\n\nCV:\n${cvText.slice(0, 4000)}\n\nJob description:\n${jobDescription.slice(0, 2000)}`
    const raw = await chat(settings, prompt)
    const match = raw.match(/\{[^}]*"score"\s*:\s*(\d+)[^}]*\}/)
    if (!match) return null
    const score = parseInt(match[1], 10)
    return Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : null
  } catch {
    return null
  }
}

export async function generateDocument(
  cvText: string,
  jobDescription: string,
  type: DocumentType,
  settings: UserSettings,
): Promise<string> {
  const prompts: Record<DocumentType, string> = {
    cover_letter: `Write a concise, professional cover letter for this job based on this CV. Return markdown only.\n\nCV:\n${cvText.slice(0, 4000)}\n\nJob description:\n${jobDescription.slice(0, 2000)}`,
    tailored_cv: `Rewrite this CV to be tailored for this job description. Return markdown only.\n\nCV:\n${cvText.slice(0, 4000)}\n\nJob description:\n${jobDescription.slice(0, 2000)}`,
  }
  try {
    return await chat(settings, prompts[type])
  } catch (err) {
    console.log('generateDocument failed', { type, err })
    return ''
  }
}

export async function extractJobTitles(
  cvText: string,
  settings: UserSettings,
): Promise<string[]> {
  try {
    const prompt = `Given this CV, return the top 3 job titles this person should search for.\nReturn JSON only: { "titles": ["...", "...", "..."] }\n\nCV:\n${cvText.slice(0, 4000)}`
    const raw = await chat(settings, prompt)
    const match = raw.match(/"titles"\s*:\s*\[([^\]]+)\]/)
    if (!match) return []
    return JSON.parse(`[${match[1]}]`) as string[]
  } catch {
    return []
  }
}

export interface JobCandidate {
  index: number
  title: string
  company: string
  descriptionSnippet: string
}

export async function batchMatchScore(
  cvText: string,
  jobs: JobCandidate[],
  settings: UserSettings,
): Promise<Array<{ index: number; score: number | null }>> {
  try {
    const jobList = jobs
      .map(j => `${j.index}. ${j.title} @ ${j.company}: ${j.descriptionSnippet}`)
      .join('\n')
    const prompt = `Score each job against this CV. Return JSON only:\n[{ "index": 0, "score": <integer 0-100> }, ...]\n\nCV:\n${cvText.slice(0, 3000)}\n\nJobs:\n${jobList}`
    const raw = await chat(settings, prompt)
    const arrayMatch = raw.match(/\[[\s\S]*\]/)
    if (!arrayMatch) return jobs.map(j => ({ index: j.index, score: null }))
    const parsed = JSON.parse(arrayMatch[0]) as Array<{ index: number; score: number }>
    return parsed.map(item => ({
      index: item.index,
      score: Number.isFinite(item.score) ? Math.min(100, Math.max(0, item.score)) : null,
    }))
  } catch {
    return jobs.map(j => ({ index: j.index, score: null }))
  }
}
