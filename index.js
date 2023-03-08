const express = require('express')
const app = express()
let Client = require('ssh2-sftp-client');
let sftp = new Client();
const fs = require('fs')
require('dotenv').config()

var result;
result = []
app.get('/', async (req, res) => {
	await sftp.connect({
		host: process.env.HOST,
		username: process.env.USERNAME,
		password: process.env.PASSWORD
	}).then(() => {
		return sftp.list('.');
	}).then(data => {
		result = data
	}).catch(err => {
		console.log(err, 'catch error');
	});
	res.send(result)
	sftp.end();
})

app.get('/download', async (req, res) => {
	try {
		const response = {
			"Status": "success",
			"Message": "Files Downloaded Sucessfully!",
			"Code": 200,
			"Files": []
		}

		let remotePath = './path1';
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
			if (
				(!startDate || file.modifyTime >= startDate) &&
				(!endDate || file.modifyTime < endDate) &&
				(!fileName || file.name === fileName) &&
				(!startsWith || file.name.startsWith(startsWith))&&
				(file.type!="d")
			) {
				files.push(file);
			}
		}
			
		for (const file of files) {
			let t = await downloadFile([file], remotePath, localPath)
			if (t.code == 400) {
				throw Error
			} else {
				response.Files.push(t)
			}
		}
		res.send(response)
	} catch (Err) {
		console.log(Err)
		res.send({
			"Status": "fail",
			"Message": "Bad Request",
			"Code": 400,
			"Files": []
		})
	}
	sftp.end();
})

const downloadFile = async (array, remotePath, localPath) => {
	try {
		let fileResponse = {
			"fileName": "",
			"path": "",
			"message": "file Downloaded successfully",
			"code": 200
		}
		if (!fs.existsSync(localPath)) {
			fs.mkdir(localPath, {
				recursive: true
			}, err => {
				console.log(err)
			})
		}
		let localFile = localPath + "/" + array[0].name
		let dst = fs.createWriteStream(localFile);
		return sftp.get(remotePath + "/" + array[0].name, dst).then(() => {
			var res = {
				...fileResponse
			}
			res.fileName = array[0].name
			res.path = remotePath
			res.message = "Successfully Downloaded " + array[0].name
			return (res)
		}).catch((Err) => {
			console.log(Err)
			res.send({
				"Status": "fail",
				"Message": "Bad Request",
				"Code": 400,
				"Files": []
			})
		})

	} catch (err) {
		console.error(err);
	}
}

app.delete('/', async (req, res) => {
	var array = [{
		path: "./path1",
		filename: "sampleText1.txt",
	}, {
		path: "./path1",
		filename: "sampleDoc.csv",
	}]
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
			var fileRes = {
				...fileResponse
			}
			fileRes.fileName = t.filename
			fileRes.path = t.path
			fileRes.message = res
			response.Files.push(fileRes)
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
	sftp.end();
})

app.post('/', async (req, res) => {
	var array = [{
		path: "./path1",
		filename: "sampleText1.txt",
		body: "samplebody"
	}, {
		path: "./path1",
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
			var fileRes = {
				...fileResponse
			}
			fileRes.fileName = t.filename
			fileRes.path = t.path
			fileRes.message = res
			response.Files.push(fileRes)
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
	sftp.end();
})

app.listen(3000,(()=>{
	console.log("listing to port 3000")
}))