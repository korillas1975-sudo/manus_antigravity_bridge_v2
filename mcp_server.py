#!/usr/bin/env python3
"""
MCP Server for Manus-Antigravity Chat Bridge
MODIFIED BY LEWIS (ANTIGRAVITY): Fixed JSON-RPC handshake and initialize handler for modern MCP clients.
"""

import json
import sys
import os
import requests
from typing import Any
from datetime import datetime

# Configuration
CHAT_BRIDGE_URL = os.getenv("CHAT_BRIDGE_URL", "https://3000-isjegl2hq9owfxq5ebes0-5eb58adb.sg1.manus.computer/api/trpc")
API_KEY = os.getenv("MANUS_BRIDGE_API_KEY", "e80118a1555db7ee07e3a5ec710423da069521addb85392607e3cceebd013e89")
SESSION_ID = os.getenv("CHAT_SESSION_ID", "session-rPAd6r3RvZ3c1xuk2yGHd")


class MCPServer:
    def __init__(self):
        self.session_id = SESSION_ID
        self.api_key = API_KEY
        # Ensure bridge_url ends with /api/trpc
        url = CHAT_BRIDGE_URL.rstrip('/')
        if not url.endswith('/api/trpc'):
            url = f"{url}/api/trpc"
        self.bridge_url = url

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
        request_id = request.get("id")

        result = None

        if method == "initialize":
            result = {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "resources": {},
                    "tools": {}
                },
                "serverInfo": {
                    "name": "manus-antigravity-bridge",
                    "version": "1.0.0"
                }
            }
        
        elif method == "resources/list":
            result = {
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
                result = {"contents": [{"uri": uri, "mimeType": "application/json", "text": json.dumps(self.get_messages())}]}
            elif uri == "chat://status":
                result = {
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
            result = {
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
                        "inputSchema": {
                            "type": "object",
                            "properties": {}
                        },
                    },
                    {
                        "name": "get_session_info",
                        "description": "Get current session information",
                        "inputSchema": {
                            "type": "object",
                            "properties": {}
                        },
                    },
                ]
            }

        elif method == "tools/call":
            tool_name = params.get("name")
            tool_input = params.get("input", {})

            if tool_name == "send_message":
                res = self.send_message(tool_input.get("content", ""))
                result = {"content": [{"type": "text", "text": json.dumps(res)}]}

            elif tool_name == "get_messages":
                res = self.get_messages()
                result = {"content": [{"type": "text", "text": json.dumps(res)}]}

            elif tool_name == "get_session_info":
                result = {
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

        if result is not None:
            return {"jsonrpc": "2.0", "id": request_id, "result": result}
        elif request_id is not None:
            return {
                "jsonrpc": "2.0", 
                "id": request_id, 
                "error": {"code": -32601, "message": f"Method not found: {method}"}
            }
        else:
            return None


def main():
    """Main entry point for the MCP server"""
    server = MCPServer()

    # Update MCP status to connected
    server.update_mcp_status(True)
    print(f"[MCP Server] Connected to chat bridge", file=sys.stderr)
    print(f"[MCP Server] Session ID: {server.session_id}", file=sys.stderr)

    try:
        for line in sys.stdin:
            try:
                request = json.loads(line)
                response = server.handle_request(request)
                if response is not None:
                    print(json.dumps(response))
                    sys.stdout.flush()
            except json.JSONDecodeError as e:
                print(json.dumps({"jsonrpc": "2.0", "error": {"code": -32700, "message": f"Parse error: {str(e)}"}}))
                sys.stdout.flush()
            except Exception as e:
                print(json.dumps({"jsonrpc": "2.0", "error": {"code": -32603, "message": f"Internal error: {str(e)}"}}))
                sys.stdout.flush()
    except KeyboardInterrupt:
        server.update_mcp_status(False)
        print(f"[MCP Server] Disconnected", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
