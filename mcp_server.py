#!/usr/bin/env python3
"""
MCP Server for Manus-Antigravity Chat Bridge
This server allows Antigravity AI to communicate with the chat bridge
"""

import json
import sys
import os
import requests
from typing import Any
from datetime import datetime

# Configuration
CHAT_BRIDGE_URL = os.getenv("CHAT_BRIDGE_URL", "http://localhost:3000/api/trpc")
API_KEY = os.getenv("MANUS_BRIDGE_API_KEY", "your-api-key-here")
SESSION_ID = os.getenv("CHAT_SESSION_ID", "default-session")


class MCPServer:
    def __init__(self):
        self.session_id = SESSION_ID
        self.api_key = API_KEY
        self.bridge_url = CHAT_BRIDGE_URL

    def send_message(self, content: str) -> dict:
        """Send a message from Antigravity AI to the chat bridge"""
        try:
            # Call the tRPC endpoint to post message
            endpoint = f"{self.bridge_url}/chat.postAntigravityMessage"
            payload = {
                "sessionId": self.session_id,
                "content": content,
                "apiKey": self.api_key,
            }

            response = requests.post(endpoint, json=payload)
            response.raise_for_status()

            return {
                "success": True,
                "message": "Message sent successfully",
                "timestamp": datetime.now().isoformat(),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_messages(self) -> dict:
        """Get all messages from the chat session"""
        try:
            endpoint = f"{self.bridge_url}/chat.getMessages"
            payload = {
                "sessionId": self.session_id,
                "apiKey": self.api_key,
            }

            response = requests.post(endpoint, json=payload)
            response.raise_for_status()

            data = response.json()
            return {
                "success": True,
                "messages": data.get("result", {}).get("data", []),
            }
        except Exception as e:
            return {"success": False, "error": str(e), "messages": []}

    def update_mcp_status(self, connected: bool) -> dict:
        """Update MCP connection status"""
        try:
            endpoint = f"{self.bridge_url}/chat.updateMCPStatus"
            payload = {
                "sessionId": self.session_id,
                "connected": connected,
                "apiKey": self.api_key,
            }

            response = requests.post(endpoint, json=payload)
            response.raise_for_status()

            return {"success": True, "status": "connected" if connected else "disconnected"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def handle_request(self, request: dict) -> dict:
        """Handle incoming MCP requests"""
        method = request.get("method")
        params = request.get("params", {})

        if method == "resources/list":
            return {
                "resources": [
                    {
                        "uri": "chat://messages",
                        "name": "Chat Messages",
                        "description": "All messages in the current chat session",
                        "mimeType": "application/json",
                    },
                    {
                        "uri": "chat://status",
                        "name": "Chat Status",
                        "description": "Current chat session status",
                        "mimeType": "application/json",
                    },
                ]
            }

        elif method == "resources/read":
            uri = params.get("uri")
            if uri == "chat://messages":
                return {"contents": [{"uri": uri, "mimeType": "application/json", "text": json.dumps(self.get_messages())}]}
            elif uri == "chat://status":
                return {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps(
                                {
                                    "sessionId": self.session_id,
                                    "connected": True,
                                    "timestamp": datetime.now().isoformat(),
                                }
                            ),
                        }
                    ]
                }

        elif method == "tools/list":
            return {
                "tools": [
                    {
                        "name": "send_message",
                        "description": "Send a message to the chat bridge",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "content": {
                                    "type": "string",
                                    "description": "The message content to send",
                                }
                            },
                            "required": ["content"],
                        },
                    },
                    {
                        "name": "get_messages",
                        "description": "Get all messages from the current chat session",
                        "inputSchema": {"type": "object", "properties": {}},
                    },
                    {
                        "name": "get_session_info",
                        "description": "Get current session information",
                        "inputSchema": {"type": "object", "properties": {}},
                    },
                ]
            }

        elif method == "tools/call":
            tool_name = params.get("name")
            tool_input = params.get("input", {})

            if tool_name == "send_message":
                result = self.send_message(tool_input.get("content", ""))
                return {"content": [{"type": "text", "text": json.dumps(result)}]}

            elif tool_name == "get_messages":
                result = self.get_messages()
                return {"content": [{"type": "text", "text": json.dumps(result)}]}

            elif tool_name == "get_session_info":
                return {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(
                                {
                                    "sessionId": self.session_id,
                                    "bridgeUrl": self.bridge_url,
                                    "timestamp": datetime.now().isoformat(),
                                }
                            ),
                        }
                    ]
                }

        return {"error": f"Unknown method: {method}"}


def main():
    """Main entry point for the MCP server"""
    server = MCPServer()

    # Update MCP status to connected
    server.update_mcp_status(True)
    print(f"[MCP Server] Connected to chat bridge", file=sys.stderr)
    print(f"[MCP Server] Session ID: {server.session_id}", file=sys.stderr)

    try:
        while True:
            # Read incoming request from stdin
            line = sys.stdin.readline()
            if not line:
                break

            try:
                request = json.loads(line)
                response = server.handle_request(request)
                print(json.dumps(response))
                sys.stdout.flush()
            except json.JSONDecodeError as e:
                print(json.dumps({"error": f"Invalid JSON: {str(e)}"}))
                sys.stdout.flush()
            except Exception as e:
                print(json.dumps({"error": f"Server error: {str(e)}"}))
                sys.stdout.flush()
    except KeyboardInterrupt:
        server.update_mcp_status(False)
        print(f"[MCP Server] Disconnected", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
