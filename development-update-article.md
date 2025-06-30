# Script Kit Development Update: Two Weeks of Major Progress

*June 7-19, 2025*

The Script Kit team has been incredibly busy over the past two weeks, shipping **78 commits** packed with exciting new features, major API improvements, and enhanced developer experience. Here's what's been cooking in the Script Kit kitchen! 🚀

## 🎯 Major New Features

### Model Context Protocol (MCP) Integration
One of the biggest additions is comprehensive **Model Context Protocol (MCP) server integration**. This groundbreaking feature allows Script Kit to seamlessly interact with AI models and external tools through a standardized protocol. The implementation includes:

- Complete MCP server integration with TypeScript support
- New `sendResult()` function for MCP format handling
- Global `MCPToolResult` type for enhanced type safety
- Comprehensive documentation and testing coverage

### React/JSX Form Support
Script Kit now supports **React and JSX** for creating beautiful, interactive forms! This Phase 1 implementation includes:

- New `formReact` API for server-side React rendering
- TSX/JSX loader for compiling React scripts directly
- Enhanced React dependencies and type definitions
- Full integration with Script Kit's existing form system

### Enhanced Parameter Handling
The `params()` function has received major improvements:

- **Type inference** for better TypeScript development experience  
- Simplified parameter schema handling
- Enhanced input schema validation
- Better error messaging for debugging
- Replaced the old `tool()` API with the more powerful `params()` API

## 🔧 Developer Experience Improvements

### Testing & Build Infrastructure
- Comprehensive test coverage additions with **AVA testing framework**
- Fixed ES modules compatibility issues
- Enhanced build process with better TypeScript support
- Improved loader system for different file types (.ts, .tsx, .jsx)

### 1Password Integration
New secure secret management through **1Password CLI integration**:
- Seamless secret retrieval from 1Password vaults
- Enhanced `env()` function with 1Password reference support
- Caching options for improved performance

### AI-Powered Script Generation
Introduced "Generate Script with AI" functionality:
- New CLI commands for AI-assisted script creation
- Enhanced script creation workflow
- Better integration with the Script Kit ecosystem

## 🎨 User Interface Enhancements

### Theme System Improvements
- Enhanced theme selector with conflict warnings
- Better CSS handling and validation
- Improved visual feedback system

### Metadata Support Expansion
- **Emoji support** for scripts and choices
- **Timeout metadata** for better script control
- **Long-running script** metadata support
- Enhanced script parsing capabilities

## 🐛 Stability & Performance

### Argument Handling Overhaul
Significant improvements to how Script Kit handles command-line arguments:
- Fixed GitHub Actions integration
- Better script argument passing
- Improved CLI consistency across different environments

### Type Safety Improvements  
- Resolved TypeScript verification errors across the codebase
- Enhanced type definitions for better IntelliSense
- Improved global type declarations

## 📊 Development Stats

- **78 total commits** in 2 weeks
- **6 major feature additions**
- **Multiple API improvements**
- **Enhanced testing coverage**
- **Improved documentation**

## 🔮 What's Next?

This development sprint demonstrates Script Kit's commitment to:
- **Modern development practices** with React/JSX support
- **AI integration** through MCP and script generation
- **Developer experience** with better TypeScript support
- **Security** through 1Password integration
- **Stability** through comprehensive testing

The Script Kit ecosystem continues to evolve rapidly, making automation more accessible and powerful for developers everywhere. Whether you're building simple utilities or complex workflows, these updates provide the foundation for even more creative possibilities.

---

*Want to try these new features? Update to the latest version of Script Kit and explore the enhanced APIs. Join the discussion at [github.com/johnlindquist/kit/discussions](https://github.com/johnlindquist/kit/discussions) to share your feedback and ideas!*

**[Download Script Kit](https://scriptkit.com) | [View Documentation](https://github.com/johnlindquist/kit-docs) | [Join GitHub Discussions](https://github.com/johnlindquist/kit/discussions)**