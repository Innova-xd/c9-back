import { Request, Response } from 'express';
import fetch from 'node-fetch';
const express = require('express');
const gptTurboRouter = express.Router();


gptTurboRouter.post('/turbo',  async  (req: Request, res: Response)  => {
    
    const options = {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model : "gpt-4-0125-preview",
            messages: [{role: "user", content: req.body.message}]
        })
    }
  

try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', options)
    const data = await response.json()
    res.send(data)
} catch (error) {
    console.error(options)
    //console.error(error)
}
})


export default gptTurboRouter;
