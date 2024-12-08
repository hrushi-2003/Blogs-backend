import { PrismaClient } from "@prisma/client";

import zod from "zod";

const prisma = new PrismaClient();

const userBlogsHashTable: { [userId: number]: any[] } = {};

class TrieNode {
  children: { [key: string]: TrieNode } = {};
  isEndOfWord = false;
}

class Trie {
  root: TrieNode = new TrieNode();

  insert(word: string) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
  }

  search(prefix: string): string[] {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children[char]) return [];
      node = node.children[char];
    }
    return this.getWords(node, prefix);
  }

  private getWords(node: TrieNode, prefix: string): string[] {
    let results: string[] = [];
    if (node.isEndOfWord) results.push(prefix);

    for (const char in node.children) {
      results = results.concat(
        this.getWords(node.children[char], prefix + char)
      );
    }
    return results;
  }
}

const titleTrie = new Trie();

// Zod schemas for validation
const postSchema = zod.object({
  title: zod.string().min(2),
  description: zod.string(),
});

const updateSchema = zod.object({
  id: zod.number(),
  title: zod.string().min(2).optional(),
  description: zod.string().optional(),
});

// Create Post
export const createPost = async (req: any, res: any) => {
  try {
    const body = req.body;
    const { success } = postSchema.safeParse(body);

    if (!success) {
      return res.status(400).json({
        message: "Validation of inputs failed",
      });
    }

    const blog = await prisma.post.create({
      data: {
        ...body,
        authorId: req.id,
      },
    });

    // Add title to Trie for autocomplete

    titleTrie.insert(blog.title);
    return res.status(200).json({
      message: "Blog created successfully",
      blog,
    });
  } catch (e) {
    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

// Update Blog
export const updateBlog = async (req: any, res: any) => {
  try {
    const body = req.body;
    const { success } = updateSchema.safeParse(body);

    if (!success) {
      return res.status(400).json({
        message: "Validation Error",
      });
    }
    const blog = await prisma.post.update({
      data: {
        title: body.title,
        description: body.description,
      },
      where: {
        id: body.id,
      },
    });

    return res.status(200).json({
      message: "Blog updated successfully",
      blog,
    });
  } catch (e) {
    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

// Get All Blogs with Pagination, Search, and Autocomplete
export const getAllBlogs = async (req: any, res: any) => {
  const { page = 1, limit = 10, title = "" } = req.query;
  const skip = (page - 1) * limit;

  try {
    const suggestions = title ? titleTrie.search(title) : [];
    const blogs = await prisma.post.findMany({
      where: {
        title: {
          contains: title,
          mode: "insensitive",
        },
      },
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.status(200).json({
      message: "Blogs retrieved successfully",
      blogs,
      suggestions,
      page,
    });
  } catch (e) {
    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

// Get All Blogs by a User
export const getBlogsByUser = async (req: any, res: any) => {
  const userId = req.id;

  try {
    if (!userBlogsHashTable[userId]) {
      const blogs = await prisma.post.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
      });
      userBlogsHashTable[userId] = blogs;
    }

    return res.status(200).json({
      message: "User blogs retrieved successfully",
      blogs: userBlogsHashTable[userId],
    });
  } catch (e) {
    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

// Get Blog by ID

export const getBlogById = async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const blog = await prisma.post.findUnique({
      where: { id: Number(id) },
    });
    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }
    return res.status(200).json({
      message: "Blog retrieved successfully",
      blog,
    });
  } catch (e) {
    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};
