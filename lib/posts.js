import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import remark from 'remark'
import html from 'remark-html'
import fetch from 'node-fetch'
const base64 = require('js-base64').Base64;

const postsDirectory = path.join(process.cwd(), 'posts')

export function getSortedPostsData() {
  // Get file names under /posts
  const fileNames = fs.readdirSync(postsDirectory)
  const allPostsData = fileNames.map(fileName => {
    // Remove ".md" from file name to get id
    const id = fileName.replace(/\.md$/, '')

    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents)

    // Combine the data with the id
    return {
      id,
      ...matterResult.data
    }
  })
  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1
    } else {
      return -1
    }
  })
}

export async function getAllPostIds() {
  //Githubの外部APIを取得する時の書き方
  // https://api.github.com/repos/{owner}/{repo}/contents/{path}

  const repoUrl = `https://api.github.com/repos/kasugatakuya/nextjs-blog/contents/posts`
  const response = await fetch(repoUrl)
  const files = await response.json()
  const fileNames = files.map(file => file.name)
  // const fileNames = fs.readdirSync(postsDirectory)
  return fileNames.map(fileName => {
    return {
      params: {
        id: fileName.replace(/\.md$/, '')
      }
    }
  })
}

export async function getPostData(id) {
  // const fullPath = path.join(postsDirectory, `${id}.md`)
  // const fileContents = fs.readFileSync(fullPath, 'utf8')
  
  const repoUrl = `https://api.github.com/repos/kasugatakuya/nextjs-blog/contents/posts/${id}.md`
  const response = await fetch(repoUrl)
  const file = await response.json()
  const fileContents = base64.decode(file.content)

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents)

  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content)
  const contentHtml = processedContent.toString()

  // Combine the data with the id and contentHtml
  return {
    id,
    contentHtml,
    ...matterResult.data
  }
}