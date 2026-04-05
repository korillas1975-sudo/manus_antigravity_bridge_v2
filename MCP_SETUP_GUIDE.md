# Manus-Antigravity Chat Bridge - MCP Setup Guide

This guide will help you connect Google Antigravity to the Manus-Antigravity Chat Bridge using the Model Context Protocol (MCP).

## Overview

The MCP Server acts as a bridge between Antigravity AI and the Chat Bridge application. It allows Antigravity to:
- Send messages to the chat room
- Retrieve conversation history
- Monitor session status
- Interact with Manus in real-time

## Prerequisites

1. **Python 3.7+** installed on your system
2. **Google Antigravity** installed and running on your desktop
3. **Access to the Chat Bridge URL** (provided when you deploy the application)
4. **API Key** for authentication (generated in the Chat Bridge settings)

## Installation Steps

### Step 1: Download the MCP Server Script

The MCP server script is located in the project directory:
```
mcp_server.py
```

Copy this file to a location on your computer where you want to keep it. For example:
```bash
# On macOS/Linux
mkdir -p ~/.antigravity/mcp
cp mcp_server.py ~/.antigravity/mcp/

# On Windows
mkdir %USERPROFILE%\.antigravity\mcp
copy mcp_server.py %USERPROFILE%\.antigravity\mcp\
```

### Step 2: Get Your Configuration Values

You need three pieces of information:

1. **Chat Bridge URL**: This is the URL of your deployed Chat Bridge application
   - Example: `https://your-app.manus.space/api/trpc`

2. **Session ID**: The chat session ID you want to connect to
   - You can find this in the Chat Bridge UI after creating a session
   - Example: `session-abc123def456`

3. **API Key**: A secret key for authentication
   - Generate this in the Chat Bridge settings page
   - Keep this secure and never share it

### Step 3: Create MCP Configuration File

Open your Antigravity settings and locate the MCP configuration file at:
```
~/.gemini/antigravity/mcp_config.json
```

Add the following configuration to the `mcpServers` object:

```json
{
  "mcpServers": {
    "manus_antigravity_bridge": {
      "command": "python3",
      "args": ["/path/to/mcp_server.py"],
      "env": {
        "CHAT_BRIDGE_URL": "https://your-app.manus.space/api/trpc",
        "MANUS_BRIDGE_API_KEY": "your-api-key-here",
        "CHAT_SESSION_ID": "your-session-id-here"
      }
    }
  }
}
```

**Important**: Replace the placeholders with your actual values:
- `/path/to/mcp_server.py` - Full path to where you saved the script
- `https://your-app.manus.space/api/trpc` - Your Chat Bridge URL
- `your-api-key-here` - Your API key
- `your-session-id-here` - Your session ID

### Step 4: Restart Antigravity

After updating the configuration file, restart Google Antigravity:
1. Close Antigravity completely
2. Reopen it
3. The MCP server should now be connected

### Step 5: Verify Connection

In the Chat Bridge UI, you should see:
- The MCP connection status showing as "Connected"
- Messages from Antigravity appearing in the chat with the "Antigravity AI" label

## Using the Chat Bridge with Antigravity

Once connected, you can use these commands in Antigravity:

### Send a Message
```
Use the "send_message" tool to post messages to the chat
```

### Get Messages
```
Use the "get_messages" tool to retrieve all messages in the session
```

### Get Session Info
```
Use the "get_session_info" tool to see current session details
```

## Troubleshooting

### MCP Server Won't Connect

1. **Check Python Installation**
   ```bash
   python3 --version
   ```
   Should show Python 3.7 or higher

2. **Verify File Path**
   - Make sure the path to `mcp_server.py` is correct
   - Use absolute paths, not relative paths

3. **Check Environment Variables**
   - Verify that `CHAT_BRIDGE_URL`, `MANUS_BRIDGE_API_KEY`, and `CHAT_SESSION_ID` are set correctly
   - No typos or extra spaces

4. **Test Connectivity**
   ```bash
   python3 /path/to/mcp_server.py
   ```
   Should run without errors (press Ctrl+C to stop)

### Messages Not Appearing

1. **Verify API Key**
   - Make sure the API key is correct
   - Check if it has been regenerated in the Chat Bridge settings

2. **Check Session ID**
   - Confirm the session ID matches the one in the Chat Bridge UI
   - Session IDs are case-sensitive

3. **Check Bridge URL**
   - Ensure the URL is accessible from your machine
   - Try opening it in your browser to verify

### Connection Drops

1. **Check Network**
   - Ensure your internet connection is stable
   - Check if there's a firewall blocking the connection

2. **Restart Services**
   - Restart Antigravity
   - Restart the Chat Bridge (if you're running it locally)

## Security Notes

- **Never share your API key** - Treat it like a password
- **Use HTTPS** - Always use HTTPS URLs for the Chat Bridge
- **Secure Configuration** - The `mcp_config.json` file contains sensitive information; keep it secure
- **Regenerate Keys** - If you suspect your API key has been compromised, regenerate it in the settings

## Advanced Configuration

### Custom Python Environment

If you have multiple Python versions installed, specify the full path:

```json
{
  "mcpServers": {
    "manus_antigravity_bridge": {
      "command": "/usr/local/bin/python3",
      "args": ["/path/to/mcp_server.py"],
      "env": { ... }
    }
  }
}
```

### Running MCP Server Separately

For debugging, you can run the MCP server in a terminal:

```bash
export CHAT_BRIDGE_URL="https://your-app.manus.space/api/trpc"
export MANUS_BRIDGE_API_KEY="your-api-key"
export CHAT_SESSION_ID="your-session-id"
python3 /path/to/mcp_server.py
```

## Support

If you encounter issues:

1. Check the Antigravity logs for error messages
2. Review the Chat Bridge server logs
3. Ensure all configuration values are correct
4. Try restarting both Antigravity and the Chat Bridge

## Next Steps

Once connected, you can:
- Have Antigravity analyze code and share insights in the chat
- Ask Manus questions and see Antigravity's perspective
- Build AI-assisted workflows that involve both systems
- Create a collaborative development environment

Happy chatting! 🚀
