# AgentifUI Full Deployment Guide

This document provides a complete step-by-step guide for deploying the AgentifUI project from scratch, including environment setup, Supabase configuration, environment variables, and creating an admin account.

## 📋 Environment Preparation Checklist

### 1. Required Tools

Ensure the following tools are installed on your system:

| Tool             | Minimum Version | Recommended Version | Installation Guide                       | Verify Command        |
| ---------------- | ----------------| --------------------| ---------------------------------------- | --------------------- |
| **Node.js**      | 18.0.0+          | 22.15.0+             | [Download](https://nodejs.org/)          | `node --version`      |
| **pnpm**         | 9.0.0+           | 10.11.0+             | `npm install -g pnpm`                    | `pnpm --version`      |
| **Git**          | 2.30.0+          | 2.39.5+              | [Download](https://git-scm.com/)         | `git --version`       |
| **Supabase CLI** | 1.0.0+           | Latest               | `pnpm add -g supabase`                   | `supabase --version`  |

### 2. Installation Steps

#### Install Node.js

```bash
# Method 1: Download from the official website
# Visit https://nodejs.org/ and download the LTS version

# Method 2: Use nvm (Recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22.15.0
nvm use 22.15.0
