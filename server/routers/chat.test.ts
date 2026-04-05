import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("chat router", () => {
  describe("getOrCreateSession", () => {
    it("creates a new session with provided title", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.getOrCreateSession({
        title: "Test Chat Session",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe("Test Chat Session");
      expect(result.ownerId).toBe(ctx.user.id);
    });

    it("creates a session with default title if not provided", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.getOrCreateSession({});

      expect(result).toBeDefined();
      expect(result.title).toBe("New Chat");
    });

    it("returns existing session if sessionId is provided", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const firstCall = await caller.chat.getOrCreateSession({
        title: "First Session",
      });

      const secondCall = await caller.chat.getOrCreateSession({
        sessionId: firstCall.id,
        title: "Different Title",
      });

      expect(secondCall.id).toBe(firstCall.id);
      expect(secondCall.title).toBe("First Session"); // Should keep original title
    });
  });

  describe("sendMessage", () => {
    it("creates a user message in the database", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const session = await caller.chat.getOrCreateSession({
        title: "Test Session",
      });

      const messageResult = await caller.chat.sendMessage({
        sessionId: session.id,
        content: "Hello, this is a test message",
      });

      expect(messageResult).toBeDefined();
    });

    it("rejects empty messages", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const session = await caller.chat.getOrCreateSession({
        title: "Test Session",
      });

      try {
        await caller.chat.sendMessage({
          sessionId: session.id,
          content: "",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("String must contain at least 1 character");
      }
    });
  });

  describe("getMessages", () => {
    it("retrieves messages for a session", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const session = await caller.chat.getOrCreateSession({
        title: "Test Session",
      });

      await caller.chat.sendMessage({
        sessionId: session.id,
        content: "First message",
      });

      await caller.chat.sendMessage({
        sessionId: session.id,
        content: "Second message",
      });

      const messages = await caller.chat.getMessages({
        sessionId: session.id,
      });

      expect(messages.length).toBeGreaterThanOrEqual(2);
      expect(messages.some((m) => m.content === "First message")).toBe(true);
      expect(messages.some((m) => m.content === "Second message")).toBe(true);
    });

    it("returns empty array for session with no messages", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const session = await caller.chat.getOrCreateSession({
        title: "Empty Session",
      });

      const messages = await caller.chat.getMessages({
        sessionId: session.id,
      });

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(0);
    });
  });

  describe("getSessions", () => {
    it("retrieves user's chat sessions", async () => {
      const ctx = createAuthContext(42);
      const caller = appRouter.createCaller(ctx);

      const session1 = await caller.chat.getOrCreateSession({
        title: "Session 1",
      });

      const session2 = await caller.chat.getOrCreateSession({
        title: "Session 2",
      });

      const sessions = await caller.chat.getSessions();

      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThanOrEqual(2);
      expect(sessions.some((s) => s.id === session1.id)).toBe(true);
      expect(sessions.some((s) => s.id === session2.id)).toBe(true);
    });
  });

  describe("postManusMessage", () => {
    it("rejects messages without valid API key", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.chat.postManusMessage({
          sessionId: "test-session",
          content: "Test message",
          apiKey: "wrong-key",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("postAntigravityMessage", () => {
    it("rejects messages without valid API key", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.chat.postAntigravityMessage({
          sessionId: "test-session",
          content: "Test message",
          apiKey: "wrong-key",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("updateMCPStatus", () => {
    it("rejects status updates without valid API key", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.chat.updateMCPStatus({
          sessionId: "test-session",
          connected: true,
          apiKey: "wrong-key",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
