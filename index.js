require("dotenv").config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ytt = require("youtube-transcript");
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/generate-quiz', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: "No video URL provided" });
    }

    try {
        const transcript = await ytt.YoutubeTranscript.fetchTranscript(videoUrl);
        let data = transcript.map(item => item.text).join(" ");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `You are a sophisticated natural language processing AI specialized in analyzing YouTube video transcripts.
The transcript is as follows: ${data}
Perform the following task using the transcript data provided:
If the transcript is not in English Output the following text: {"error": "I cannot comprehend this language at the moment."}
else,
Check whether the transcript data content is educational 
If yes do the follwoing
generate 10 quiz related to that data and output the quiz in following text format:
{"title":"title of the quiz","quizzes": [{"question": "Question 1", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_option": "Option A"}, {"question": "Question 2", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_option": "Option B"}, ..., {"question": "Question 10", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_option": "Option C"}]}.
If its not educational or it falls in the following categories, vlogs, talks, podcasts, entertainment Output the following text {"error": "Unfortunately, this video does not meet the standards of educational content."}
NOTE: make sure the output is plain text only do not format in json object`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        res.json(JSON.parse(text));
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Sorry, this video can't be processed at this moment." });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
