import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const validateInternalKey = (key: string) => {
    const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

    if (!internalKey) {
        throw new Error("POLARIS_CONVEX_INTERNAL_KEY is not configured");
    }

    if (key !== internalKey) {
        throw new Error("Invalid internal key");
    }
}

export const getConversationById = query({
    args: {
        conversationId: v.id("conversations"),
        internalKey: v.string(),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);
        return await ctx.db.get("conversations", args.conversationId);
    },
});

export const createMessage = mutation({
    args: {
        internalKey: v.string(),
        conversationId: v.id("conversations"),
        projectId: v.id("projects"),
        role: v.union(
            v.literal("user"),
            v.literal("assistant"),
        ),
        content: v.string(),
        status: v.optional(
            v.union(
                v.literal("processing"),
                v.literal("completed"),
                v.literal("canceled"),
            ),
        ),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            projectId: args.projectId,
            role: args.role,
            content: args.content,
            status: args.status,
        });

        await ctx.db.patch("conversations", args.conversationId, {
            updatedAt: Date.now(),
        });

        return messageId;
    },
});

export const updateMessageStatus = mutation({
    args: {
        internalKey: v.string(),
        messageId: v.id("messages"),
        status: v.union(
            v.literal("processing"),
            v.literal("completed"),
            v.literal("canceled"),
        ),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        await ctx.db.patch("messages", args.messageId, {
            status: args.status,
        });
    },
});

export const updateMessageContent = mutation({
    args: {
        internalKey: v.string(),
        messageId: v.id("messages"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        await ctx.db.patch("messages", args.messageId, {
            content: args.content,
            status: "completed" as const,
        });
    },
});

export const getProcessingMessages = query({
    args: {
        internalKey: v.string(),
        projectId: v.id("projects"),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        return await ctx.db
            .query("messages")
            .withIndex("by_project_status", (q) => q.eq("projectId", args.projectId).eq("status", "processing"))
            .collect();
    },
});

// Used for Agent conversation context
export const getRecentMessages = query({
    args: {
        internalKey: v.string(),
        conversationId: v.id("conversations"),
        limit: v.number(),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .order("asc")
            .collect();
        
        const limit = args.limit ?? 10;
        return messages.slice(-limit);
    }
});

// Used for Agent to update conversation title
export const updateConversationTitle = mutation({
    args: {
        internalKey: v.string(),
        conversationId: v.id("conversations"),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        await ctx.db.patch("conversations", args.conversationId, {
            title: args.title,
            updatedAt: Date.now(),
        });
    },
});

// Used for Agent "ListFiles" tool
export const getProjectFiles = query({
    args: {
        internalKey: v.string(),
        projectId: v.id("projects"),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        return await ctx.db
            .query("files")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();
    },
});

// Used for Agent "ReadFiles" tool
export const getFileById = query({
    args: {
        internalKey: v.string(),
        fileId: v.id("files"),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        return await ctx.db.get("files", args.fileId);
    }
});

// Used for Agent "UpdateFile" tool
export const updateFile = mutation({
    args: {
        internalKey: v.string(),
        fileId: v.id("files"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        const file = await ctx.db.get("files", args.fileId);

        if (!file) {
            throw new Error("File not found");
        }

        const now = Date.now();

        await ctx.db.patch("files", args.fileId, {
            content: args.content,
            updatedAt: now,
        });

        return args.fileId;
    },
});

// Used for Agent "CreateFile" tool
export const createFile = mutation({
    args: {
        internalKey: v.string(),
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        name: v.string(),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        // Check if file with same name already exists in the parent folder
        const files = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) => q.eq("projectId", args.projectId).eq("parentId", args.parentId))
            .collect();
        
        const existingFile = files.find((file) => file.name === args.name && file.type === "file");

        if (existingFile) {
            throw new Error("A file with the same name already exists in this folder");
        }

        const now = Date.now();

        const fileId = await ctx.db.insert("files", {
            projectId: args.projectId,
            parentId: args.parentId,
            name: args.name,
            content: args.content,
            type: "file",
            updatedAt: now,
        });
        
        return fileId;
    },
});

// Used for Agent bulk "CreateFiles" tool
export const createFiles = mutation({
    args: {
        internalKey: v.string(),
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        files: v.array(
            v.object({
                name: v.string(),
                content: v.string(),
            }),
        ),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        // Check if file with same name already exists in the parent folder
        const files = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) => q.eq("projectId", args.projectId).eq("parentId", args.parentId))
            .collect();

        const results: { name: string; fileId?: string; error?: string }[] = [];

        for (const file of args.files) {
            const existingFile = files.find((f) => f.name === file.name && f.type === "file");

            if (existingFile) {
                results.push({
                    name: file.name,
                    fileId: existingFile._id,
                    error: "A file with the same name already exists in this folder"
                });
                continue;
            }

            const now = Date.now();

            const fileId = await ctx.db.insert("files", {
                projectId: args.projectId,
                parentId: args.parentId,
                name: file.name,
                content: file.content,
                type: "file",
                updatedAt: now,
            });

            results.push({
                name: file.name,
                fileId,
            });
        }

        return results;
    },
});

// Used for Agent "CreateFolder" tool
export const createFolder = mutation({
    args: {
        internalKey: v.string(),
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        // Check if file with same name already exists in the parent folder
        const files = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) => q.eq("projectId", args.projectId).eq("parentId", args.parentId))
            .collect();
        
        const existingFile = files.find((file) => file.name === args.name && file.type === "folder");

        if (existingFile) {
            throw new Error("A folder with the same name already exists in this folder");
        }

        const now = Date.now();

        const fileId = await ctx.db.insert("files", {
            projectId: args.projectId,
            parentId: args.parentId,
            name: args.name,
            type: "folder",
            updatedAt: now,
        });
        
        return fileId;
    },
});

// Used for Agent "RenameFile" tool
export const renameFile = mutation({
    args: {
        internalKey: v.string(),
        fileId: v.id("files"),
        newName: v.string(),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        const file = await ctx.db.get("files", args.fileId);
        
        if (!file) {
            throw new Error("File not found");
        }

        // Check if a file with the new name already exists in the same parent folder
        const siblings = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) => q.eq("projectId", file.projectId).eq("parentId", file.parentId))
            .collect();
        
        const existingFile = siblings.find((sibling) => sibling.name === args.newName && sibling.type === file.type && sibling._id !== args.fileId);

        if (existingFile) {
            throw new Error(`A ${file.type} with the same name already exists in this folder`);
        }

        const now = Date.now();

        await ctx.db.patch("files", args.fileId, {
            name: args.newName,
            updatedAt: now,
        });
    },
});

// Used for Agent "DeleteFile" tool
export const deleteFile = mutation({
    args: {
        internalKey: v.string(),
        fileId: v.id("files"),
    },
    handler: async (ctx, args) => {
        validateInternalKey(args.internalKey);

        const file = await ctx.db.get("files", args.fileId);
        
        if (!file) {
            throw new Error("File not found");
        }

        // Recursively delete all file/folder and all descendants
        const deleteRecursively = async (fileId: typeof args.fileId) => {
            const item = await ctx.db.get("files", fileId);

            if (!item) return;

            // If it's a folder, delete all children first
            if (item.type === "folder") {
                const children = await ctx.db
                    .query("files")
                    .withIndex("by_project_parent", (q) => q.eq("projectId", item.projectId).eq("parentId", fileId))
                    .collect();
                
                for (const child of children) {
                    await deleteRecursively(child._id);
                }
            }

            // Delete storage file if it exists
            if (item.storageId) {
                await ctx.storage.delete(item.storageId);
            }

            // Delete the file/folder itself
            await ctx.db.delete("files", fileId);
        }

        await deleteRecursively(args.fileId);

        return args.fileId;
    },
});
