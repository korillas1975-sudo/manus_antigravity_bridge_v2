import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getSessionMessages,
  createMessage,
  getOrCreateSession,
  getUserSessions,
  updateMCPStatus,
} from "../db";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

export const chatRouter = router({
  /**
   * Get or create a chat session
   */
  getOrCreateSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().optional(),
        title: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionId = input.sessionId || `session-${nanoid()}`;
      const session = await getOrCreateSession(
        sessionId,
        ctx.user.id,
        input.title
      );
      return session;
    }),

  /**
   * Get all messages for a session
   */
  getMessages: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        apiKey: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Validate API key
      if (input.apiKey !== process.env.MANUS_BRIDGE_API_KEY) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid API key",
        });
      }
      const msgs = await getSessionMessages(input.sessionId);
      return msgs;
    }),

  /**
   * Send a message from user
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const message = await createMessage({
        sessionId: input.sessionId,
        senderType: "user",
        userId: ctx.user.id,
        content: input.content,
      });
      return message;
    }),

  /**
   * Post a message from Manus (internal use)
   */
  postManusMessage: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1),
        apiKey: z.string(), // Simple API key validation
      })
    )
    .mutation(async ({ input }) => {
      // Validate API key (in production, use proper token validation)
      if (input.apiKey !== process.env.MANUS_BRIDGE_API_KEY) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid API key",
        });
      }

      const message = await createMessage({
        sessionId: input.sessionId,
        senderType: "manus",
        content: input.content,
      });
      return message;
    }),

  /**
   * Post a message from Antigravity AI (internal use)
   */
  postAntigravityMessage: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1),
        apiKey: z.string(), // Simple API key validation
      })
    )
    .mutation(async ({ input }) => {
      // Validate API key
      if (input.apiKey !== process.env.MANUS_BRIDGE_API_KEY) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid API key",
        });
      }

      const message = await createMessage({
        sessionId: input.sessionId,
        senderType: "antigravity",
        content: input.content,
      });
      return message;
    }),

  /**
   * Get user's chat sessions
   */
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await getUserSessions(ctx.user.id);
    return sessions;
  }),

  /**
   * Update MCP connection status
   */
  updateMCPStatus: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        connected: z.boolean(),
        apiKey: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.apiKey !== process.env.MANUS_BRIDGE_API_KEY) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid API key",
        });
      }

      await updateMCPStatus(input.sessionId, input.connected);
      return { success: true };
    }),
});
