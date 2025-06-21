# Content Hub - AI Learning Platform

A Next.js application for uploading and processing various types of content files to enable AI-powered learning experiences.

## Features

### 🏠 **Clean Homepage**

- Simple interface with two main actions: Upload Content and Learn
- Modern, responsive design

### 📁 **Smart File Upload & Processing**

- **Drag & drop** or click to browse file upload
- **Automatic file processing** based on file type
- **Organized storage** with each file getting its own folder
- **Support for multiple file types**:
  - Text files (.txt, .md) - stored as-is
  - Documents (.pdf, .docx, .doc) - text extracted
  - Videos (.mp4, .mov, .avi, .webm) - audio transcribed + screenshots every 5 minutes
  - Images (.jpg, .png) - stored as-is (OCR planned)
  - Data files (.json, .csv) - stored as-is

### 🔄 **File Processing Pipeline**

When you upload a file, the system:

1. Creates a unique folder with timestamp and filename
2. Stores the original file
3. Processes based on file type:
   - **PDFs/DOCX**: Extracts text content to `extracted_text.txt`
   - **Videos**:
     - Extracts audio to `extracted_audio.wav`
     - Takes screenshots every 5 minutes
     - Creates placeholder for transcript (ready for Whisper API integration)
   - **Text/Images**: Keeps original format
4. Creates a processing summary with details

### 📋 **File Management**

- View all uploaded files in organized folders
- See processing status and contents
- File size limit: 500MB per file
- Files stored in `/content` directory (gitignored)

### 🎯 **Learning Platform** (Coming Soon)

- Interactive Q&A with uploaded content
- Content analysis and summaries
- Personalized study plans
- Auto-generated quizzes

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **File Processing**:
  - PDF parsing with `pdf-parse`
  - DOCX processing with `mammoth`
  - Video processing with `ffmpeg`
- **Storage**: Local file system (expandable to cloud storage)

## Setup & Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd uc-berkeley-ai-hackathon-2025
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Verify ffmpeg installation** (required for video processing)

   ```bash
   ffmpeg -version
   ```

   If not installed on Mac: `brew install ffmpeg`

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## File Structure

```
/content/                          # Upload directory (gitignored)
  └── 2024-01-15T10-30-00_document/ # Individual file folders
      ├── document.pdf              # Original file
      ├── extracted_text.txt        # Processed content
      ├── processing_summary.txt    # Processing details
      └── ...                       # Other processed files

/app/
  ├── api/
  │   ├── upload/                   # File upload endpoint
  │   └── files/                    # File listing endpoint
  ├── lib/
  │   └── file-processor.ts         # Core processing logic
  ├── upload/                       # Upload page
  ├── learn/                        # Learning page (coming soon)
  └── page.tsx                      # Homepage
```

## API Endpoints

### POST `/api/upload`

Upload and process files

- **Input**: FormData with file
- **Output**: Processing results and folder info

### GET `/api/files`

List all uploaded files

- **Output**: Array of files/folders with metadata

## Processing Details

### PDF Documents

- Extracts all text content
- Preserves formatting where possible
- Saves to `extracted_text.txt`

### DOCX Documents

- Extracts raw text content
- Handles various document structures
- Saves to `extracted_text.txt`

### Video Files

- **Audio Extraction**: Converts to 16kHz mono WAV for transcription
- **Screenshots**: Captures frames every 5 minutes at high quality
- **Transcript Placeholder**: Ready for speech recognition integration
- **Metadata**: Duration and processing info

### Future Enhancements

1. **Audio Transcription**: OpenAI Whisper API integration
2. **OCR for Images**: Text extraction from images
3. **Cloud Storage**: S3/GCS integration
4. **Real-time Processing**: WebSocket updates
5. **Content Search**: Full-text search across processed files
6. **AI Integration**: GPT-4 for content analysis and Q&A

## Development Notes

- File processing is asynchronous and handles errors gracefully
- Original files are always preserved
- Processing failures don't prevent file storage
- All file operations use proper error handling
- TypeScript for type safety throughout

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test file processing with various file types
5. Submit a pull request

## License

[Add your license here]
