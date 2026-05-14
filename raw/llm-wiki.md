# LLM Wiki: Knowledge Management with AI

## Overview

LLM Wiki is a comprehensive knowledge management system that leverages Large Language Models (LLMs) to ingest, organize, query, and maintain structured wiki knowledge bases.

## Core Concepts

### Ingestion Pipeline

The ingestion pipeline converts raw documents into structured wiki pages:

1. **Source Input**: Raw documents (markdown, text, PDF) are placed in the `raw/` directory
2. **Content Analysis**: LLM analyzes the document structure and extracts key concepts
3. **Page Generation**: Content is split into atomic wiki pages with proper frontmatter
4. **Indexing**: Pages are registered in `index.md` for discoverability
5. **Logging**: Operations are recorded in `log.md` for audit trail

### Wiki Structure

- **Pages**: Atomic markdown files in `wiki/` directory with YAML frontmatter
- **Wikilinks**: `[[page-name]]` syntax for bidirectional linking between pages
- **Index**: `index.md` serves as the table of contents and knowledge graph entry point
- **Log**: `log.md` tracks all operations with timestamps

### AI Capabilities

- **Intelligent Query**: Natural language questions answered from wiki content
- **Content Summarization**: Automatic generation of page summaries
- **Link Suggestion**: AI recommends relevant wikilinks between pages
- **Consistency Checking**: Validates frontmatter, links, and formatting

## Technical Architecture

### MCP Server

The Model Context Protocol (MCP) server is the unified entry point for all wiki operations. It exposes:

- **MCP Transport**: For AI agent integration via standard MCP protocol
- **REST API**: For web UI and external tool integration

### Web UI

A Next.js 15 application providing:

- Dashboard for system overview
- Ingest panel for document import
- Query panel for AI-powered search
- Lint panel for consistency checking
- Index and log viewers
- Page browser

### File Formats

#### Frontmatter

```yaml
---
title: "Page Title"
source: "source-file.md"
created: "2024-01-15T00:00:00Z"
updated: "2024-01-15T10:30:00Z"
tags: ["concept", "tutorial"]
summary: "Brief description of the page content"
---
```

#### Wikilinks

Obsidian-compatible `[[page-name]]` syntax for internal linking, with automatic backlink tracking.

## Use Cases

1. **Technical Documentation**: Maintain living documentation that stays current
2. **Research Knowledge Base**: Organize research papers and findings
3. **Team Wiki**: Collaborative knowledge sharing with AI assistance
4. **Learning Journal**: Personal knowledge management with spaced repetition support

## Best Practices

- Keep pages atomic: one concept per page
- Use consistent frontmatter fields
- Leverage wikilinks for discoverability
- Run regular lint checks for integrity
- Log all significant operations
