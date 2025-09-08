# OpenAI API Key Setup

## Fix Applied

1. **Removed cached key from shell profile**: The old cached key in `~/.zshrc` has been removed
2. **Created startup script**: Use `./start-dev.sh` to start the dev server with the correct key
3. **Direct .env loading**: The application now reads the key directly from .env file

## Current Status

- **Shell profile**: Cleaned (no OPENAI_API_KEY export in ~/.zshrc)
- **Startup script**: Created at `./start-dev.sh`
- **.env file key**: `sk-proj-US0-1gpXOf8z...cl0A` (from your .env file)

## To Use

Always start the development server using:
```bash
./start-dev.sh
```

This ensures the correct OPENAI_API_KEY from your .env file is used.

## Testing

Test the API key at: http://localhost:3002/api/test-openai-fixed

## Note

The API is currently returning a 401 error with the key from your .env file. Please verify:
1. The key in .env is correct and active
2. The key has not been revoked or regenerated
3. You may need to generate a new key at https://platform.openai.com/api-keys