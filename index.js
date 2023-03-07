const express = require('express')
const app = express()
let Client = require('ssh2-sftp-client');
let sftp = new Client();
const fs = require('fs')
require('dotenv').config()

var result;
result = []
console.log('abc')
app.get('/', async (req, res) => {
	await sftp.connect({
		host: process.env.HOST,
		username: process.env.USERNAME,
		password: process.env.PASSWORD
	}).then(() => {
		return sftp.list('/');
	}).then(data => {
		result = data
	}).catch(err => {
		console.log(err, 'catch error');
	});
	res.send(result)
})

app.get('/download', async (req, res) => {
	try {
		const response = {
			"Status": "success",
			"Message": "Files Deleted Sucessfully!",
			"Code": 200,
			"Files": []
		}
		let fileResponse = {
			"fileName": "Sample2.txt",
			"path": "/samplePath",
			"message": "file deleted successfully",
			"code": 200
		}
		let remotePath = '.';
		let localPath = '.';
		let files = []
		let {
			startDate,
			endDate,
			fileName,
			startsWith
		} = req.query
		await sftp.connect({
			host: process.env.HOST,
			username: process.env.USERNAME,
			password: process.env.PASSWORD
		})
		const data = await sftp.list(remotePath);
		for (const file of data) {
			if (startDate > file.modifyTime && endDate < file.modifyTime && file.type != 'd') {
				files.push(file)
			}
		}
		// for (const file of files) {
			await downloadFile([files[0]], remotePath, localPath)
		// }
		res.send(files)
	} catch (Err) {
		res.send({
			"Status": "fail",
			"Message": "Bad Request",
			"Code": 400,
			"Files": []
		})
	}
})

const downloadFile = async (array, remotePath, localPath) => {
	try {
		if (!fs.existsSync(localPath)) {
			fs.mkdir(localPath, {
				recursive: true
			}, err => {
				console.log(err)
			})
		}
		let localFile = localPath + "/" + array[0].name
		let dst = fs.createWriteStream(localFile);
		sftp.get(remotePath + "/" + array[0].name, dst).then((data) => {
			return 'done'
		}).catch((err) => {
			console.log(err)
		})

	} catch (err) {
		console.error(err);
	}
}

app.delete('/', async (req, res) => {
	var array = [{
			path: "./path1",
			filename: "sampleText1.txt"
		}
		, {
		path: ".",
		filename: "sampleDoc.csv",
		}
	]
	const response = {
		"Status": "success",
		"Message": "Files Deleted Sucessfully!",
		"Code": 200,
		"Files": []
	}
	let fileResponse = {
		"fileName": "Sample2.txt",
		"path": "/samplePath",
		"message": "file deleted successfully",
		"code": 200
	}
	try {
		await sftp.connect({
			host: process.env.HOST,
			username: process.env.USERNAME,
			password: process.env.PASSWORD
		})
		for (const t of array) {
			const res = await sftp.delete((t.path + "/" + t.filename), true)
			fileResponse.fileName = t.filename
			fileResponse.path = t.path
			fileResponse.message = res
			response.Files.push(fileResponse)
		}
		res.send(response)
	} catch (error) {
		console.log(error)
		res.send({
			"Status": "fail",
			"Message": "Bad Request",
			"Code": 400,
			"Files": []
		})
	}
})

app.post('/', async (req, res) => {
	var array = [{
		path: "/path1",
		filename: "sampleText1.txt",
		body: "samplebody"
	}, {
		path: ".",
		filename: "sampleDoc.csv",
		body: "sample fileinformation"
	}]
	const response = {
		"Status": "success",
		"Message": "Files Uploaded Sucessfully!",
		"Code": 200,
		"Files": []
	}
	let fileResponse = {
		"fileName": "Sample2.txt",
		"path": "/samplePath",
		"message": "file deleted successfully",
		"code": 200
	}
	try {
		await sftp.connect({
			host: process.env.HOST,
			username: process.env.USERNAME,
			password: process.env.PASSWORD
		})
		for (const t of array) {
			await sftp.mkdir(t.path, true)
			const res = await sftp.put(Buffer.from(t.body), t.path + "/" + t.filename)
			fileResponse.fileName = t.filename
			fileResponse.path = t.path
			fileResponse.message = res
			response.Files.push(fileResponse)
		}
		res.send(response)
	} catch (error) {
		res.send({
			"Status": "fail",
			"Message": "Bad Request",
			"Code": 400,
			"Files": []
		})
	}
})

app.listen(3000)