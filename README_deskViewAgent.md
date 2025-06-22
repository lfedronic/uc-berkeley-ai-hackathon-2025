# 🖥️ DeskView Agent - Quick Start Guide

The `deskViewAgent` is designed to analyze images of desks, workspaces, or any scene you want to understand better.

## 🚀 How to Use Your Agent

### Option 1: Quick Demo (Recommended for Beginners)
1. Open the demo page in your browser:
   ```bash
   open test/deskViewDemo.html
   ```
2. Upload an image or use your camera
3. Choose what you want to analyze
4. Click "Analyze Image" to see results

### Option 2: Run the Test File
1. Make sure you have Node.js installed
2. Run the test file:
   ```bash
   npx ts-node test/deskViewTest.ts
   ```

### Option 3: Use in Your Own Code
```typescript
import { processDeskView } from './lib/agents/deskViewAgent';

// Analyze a desk image
const result = await processDeskView({
  image: 'data:image/jpeg;base64,/9j/4AAQ...', // Your image
  task: 'analyze',
  prompt: 'Focus on productivity improvements'
});

console.log(result.analysis);
console.log(result.objects);
console.log(result.suggestions);
```

## 🎯 What Can Your Agent Do?

Your agent can perform these tasks:

1. **📊 Analyze** - Get insights about desk organization and productivity
2. **📝 Describe** - Get a detailed description of what's in the image
3. **📄 Extract Text** - Pull text from documents or screens
4. **🎯 Identify Objects** - List all objects visible in the image
5. **🎨 Custom Analysis** - Ask any specific question about the image

## 📸 How to Provide Images

Your agent accepts images in these formats:

### Base64 String (Most Common)
```typescript
const image = 'data:image/jpeg;base64,/9j/4AAQ...';
```

### Image URL
```typescript
const imageUrl = 'https://example.com/desk-image.jpg';
const base64Image = await imageToBase64(imageUrl);
```

### Camera Capture (Browser Only)
```typescript
const capturedImage = await captureImageFromCamera();
```

## 🔧 Setup Requirements

To use the agent with real AI analysis, you'll need:

1. **Google API Key** for Gemini Vision
   - Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Set it as environment variable: `GOOGLE_API_KEY`

2. **Install Dependencies**
   ```bash
   npm install @google/generative-ai
   ```

## 📝 Example Use Cases

### Desk Organization Analysis
```typescript
const result = await processDeskView({
  image: deskImage,
  task: 'analyze',
  prompt: 'How can I improve my desk organization for better productivity?'
});
```

### Document Text Extraction
```typescript
const result = await processDeskView({
  image: documentImage,
  task: 'extract-text'
});
console.log(result.text);
```

### Object Inventory
```typescript
const result = await processDeskView({
  image: workspaceImage,
  task: 'identify-objects'
});
console.log('Objects found:', result.objects);
```

### Custom Analysis
```typescript
const result = await processDeskView({
  image: sceneImage,
  task: 'custom',
  customPrompt: 'What ergonomic improvements could be made to this workspace?'
});
```

## 🛠️ Troubleshooting

### "API Key Not Found" Error
- Make sure you have set `GOOGLE_API_KEY` environment variable
- Check that your API key is valid and has Gemini access

### "Image Format Error"
- Ensure your image is in base64 format starting with `data:image/...`
- Check that the image file isn't corrupted

### "Camera Not Working"
- Make sure you're running in a browser (not Node.js)
- Check that your browser supports camera access
- Allow camera permissions when prompted

## 🎓 Next Steps

Once you're comfortable with the basics:

1. **Integrate with your app** - Use the agent in your own projects
2. **Customize prompts** - Create specific analysis for your use case
3. **Batch processing** - Analyze multiple images at once
4. **Real-time analysis** - Connect to live camera feeds

## 📚 Learn More

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Vision AI Best Practices](https://ai.google.dev/docs/best_practices)
- [TypeScript Async/Await Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

Happy analyzing! 🎉 