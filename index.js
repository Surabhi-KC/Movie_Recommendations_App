// {
// 	"title": "movie_title",
// 	"description": "movie_description",
// 	"data": {
// 		"ratings": {
// 			"rottentomatoes": 81,
// 			"imdb": 7.8
// 		},
// 		"watch_time": 0.53
// 	}
// }

import express from 'express';
import AWS from 'aws-sdk';
import fs from 'fs';

const app = express();
app.use(express.json());

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-south-1'
});

async function readJsonFile(filePath) {
    try {
        const data = await fs.promises.readFile(filePath, "utf-8");
        const jsonData = JSON.parse(data);
        return jsonData;
    } catch (error) {
        throw error;
    }
}

const writeJsonFile = async(filePath, data) => {
    try{
    const jsonData = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(filePath, jsonData);
}
catch(error){
    throw error;
}
}

app.get('/recommendations', async(req,res) =>{
    try {
        const list = await readJsonFile("./movies.json")
        list.sort((a, b) => a.match_score - b.match_score)
        const ret = {
        "success": true,
        "data": list
    }
	res.status(200).json(ret);
        
    } catch (error) {
        const ret ={
            "success": false,
            "error" : "Internal Server Error"
        }
        res.status(500).json(ret);
    }
});

app.post('/recommendations', async(req,res) => {
	try{
        const body=req.body;

    const params = {
        FunctionName: 'movies_recommend',
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(body)
    }

    const lambda = new AWS.Lambda();
    const data = await lambda.invoke(params).promise();
    const parsed_data = JSON.parse(data.Payload).body;
    const movies = await readJsonFile("./movies.json");	
    movies.push(JSON.parse(parsed_data));
    await writeJsonFile("./movies.json", movies);
    res.status(200).send(parsed_data);
}
catch(error){
    console.log(error);
    res.status(500).send("Internal Server Error");
}

});

app.listen(3000, () => {
	console.log("Server started on port 3000");
});