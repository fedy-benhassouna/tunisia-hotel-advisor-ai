# Tunisia Hotel AI Advisor
This project is designed for a Tunisian travel agency, enabling users to query hotel information in Tunisia and receive accurate, vocalized responses. The backend leverages web scraping, semantic search, and generative AI to deliver up-to-date and personalized hotel information.

<img width="1222" height="874" alt="Tunisia Hotel AI Advisor UI " src="https://github.com/user-attachments/assets/3775caf9-9f54-45f5-aa26-c2b6186d1205" />


## Table of Contents
- [Overview](#overview)
- [Demo](#demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Request Processing Workflow](#request-processing-workflow)
- [Data Initialization Workflow](#data-initialization-workflow)
- [Setup Instructions](#setup-instructions)
- [Future Improvements](#future-improvements)

## Overview
The backend powers a voice agent that automates responses to common hotel-related queries, enhancing customer experience by providing 24/7 service. It processes user queries, retrieves relevant hotel data, generates coherent responses, and converts them into audio for a seamless interaction.

## Demo
https://github.com/user-attachments/assets/81931860-8075-40bf-b40b-c99ea37f4567



## Features
- **Semantic Search**: Uses Qdrant and FastEmbed for efficient, context-aware hotel information retrieval.
- **Generative AI**: Employs Claude Haiku (via Anthropic API) for intelligent response generation.
- **Web Scraping**: Leverages Firecrawl to extract hotel data from TripAdvisor.
- **Text-to-Speech**: Converts text responses to audio using pyttsx3.
- **API Integration**: Exposes a `/ask` endpoint for frontend interaction, returning both text and audio responses.

## Tech Stack
- **Language**: Python
- **Frameworks & Libraries**:
  - FastAPI: For building the API.
  - Firecrawl: For web scraping (TripAdvisor).
  - Qdrant: Vector database for semantic search.
  - FastEmbed: For generating text embeddings.
  - pyttsx3: For text-to-speech conversion.
  - python-dotenv: For environment variable management.
  - anthropic: For interacting with Claude Haiku API.
- **External APIs**:
  - Claude Haiku (Anthropic): For response generation.
  - Firecrawl API: For web scraping.
  - TripAdvisor: Data source for hotel information.
- **Data Formats**:
  - Embeddings: Numeric vectors for semantic search.
  - Markdown/HTML: Scraped content format.
  - Audio MP3: For vocalized responses.
  - JSON/Base64: For API request/response and audio encoding.
- **Frontend**: React with Tailwind CSS for styling.

**Example Interaction**:
- **User Query**: "Tell me about 5-star hotels in Sousse."
## Request Processing Workflow
The following diagram illustrates how a user query is processed:

![Request Processing Workflow](https://github.com/user-attachments/assets/078782c9-e8ca-473b-8350-b04ca897155c)

## Data Initialization Workflow
The following diagram shows how hotel data is initialized:
<img width="712" height="147" alt="Data Initialization Workflow" src="https://github.com/user-attachments/assets/d863c886-01f3-41bd-9a36-e0624a6842c9" />

## Setup Instructions
### Prerequisites
- Python 3.8+
- pip (Python package manager)
- Node.js and npm (for the React frontend)

### Backend Setup
1. **Clone the Repository** (if applicable):
   ```bash
   git clone https://github.com/fedy-benhassouna/tunisia-hotel-advisor-ai.git
   cd tunisia-hotel-advisor-ai
   ```

2. **Create a Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set Up Environment Variables**:
   Create a `.env` file in the project root with the following:
   ```env
   QDRANT_URL=<your-qdrant-url>  # or your Qdrant Cloud URL
   QDRANT_API_KEY=<your-qdrant-api-key>  # optional for local Qdrant
   FIRECRAWL_API_KEY=<your-firecrawl-api-key>
   CLAUDE_API_KEY=<your-claude-api-key>
   DOC_URL=https://www.tripadvisor.com/Hotels-g293733-Tunisia-Hotels.html
   ```

5. **Run the Backend**:
   Ensure the main Python file is named `main.py` or `customer_support_voice_agent.py`. Start the FastAPI server:
   ```bash
   uvicorn customer_support_voice_agent:app --host 0.0.0.0 --port 8000 --reload
   ```
   The API will be accessible at `http://localhost:8000`.

### Frontend Setup
1. **Navigate to the Frontend Directory**:
   ```bash
   cd frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Tailwind CSS**:
   Ensure Tailwind CSS is configured in your React project. If not already set up, follow these steps:
   - Install Tailwind CSS:
     ```bash
     npm install -D tailwindcss postcss autoprefixer
     npx tailwindcss init -p
     ```
   - Configure `tailwind.config.js`:
     ```javascript
     /** @type {import('tailwindcss').Config} */
     module.exports = {
       content: ["./src/**/*.{js,jsx,ts,tsx}"],
       theme: { extend: {} },
       plugins: [],
     }
     ```
   - Add Tailwind directives to `src/index.css`:
     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```

4. **Run the Frontend**:
   ```bash
   npm start
   ```
   The React app will be accessible at `http://localhost:3000`.


## Future Improvements
- **Authentication**: Add JWT/OAuth for secure API access.
- **Multilingual Support**: Extend to support French, English, and Arabic.
- **Session Management**: Maintain conversation context across queries.
- **Dynamic Data Updates**: Automate regular updates of hotel data in Qdrant.
- **Structured Data Integration**: Incorporate SQL/NoSQL databases for precise hotel information.
- **Performance Optimization**: Reduce latency in Qdrant queries and LLM calls.
- **Containerization**: Provide Docker configurations for scalable deployment.
