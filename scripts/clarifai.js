const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const fs = require("fs");
const path = require("path");

const stub = ClarifaiStub.grpc();

const metadata = new grpc.Metadata();
const api_key = "5654b2812fd44f61a85e7543a89faa27";
metadata.set("authorization", "Key " + api_key);

const getRandomResponse = (responses) => {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
};

const isImage = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
};

module.exports = (robot) => {
    const onfile = (res, file) => {
        if (!isImage(file)) {
            res.send("画像を送ってください");
            return;
        }

        res.download(file, (path) => {
            const imageBytes = fs.readFileSync(path, { encoding: "base64" }); // ファイルを読み込んでbase64エンコード
            stub.PostModelOutputs( // Clarifai APIの呼び出し
                {
                    model_id: "dog-catmodel",  // 画像認識モデルのIDを指定
                    inputs: [{ data: { image: { base64: imageBytes } } }]  // base64エンコードした画像データを入力として設定
                },
                metadata,
                (err, response) => {  // コールバック関数
                    if (err) {
                        res.send("Error: " + err);  // 何かエラーがあればエラーメッセージを返す
                        return;
                    }

                    if (response.status.code !== 10000) {  // ステータスコードが10000以外の場合はエラーメッセージを返す
                        res.send("Received failed status: " + response.status.description + "\n" + response.status.details + "\n" + response.status.code);
                        return;
                    }

                    // 判別結果の解析
                    let maxConcept = { name: "", value: 0 };
                    for (const c of response.outputs[0].data.concepts) {
                        if (c.value > maxConcept.value) {
                            maxConcept = c;
                        }
                    }

                    // 感想の決定
                    let responseText = "";
                    if (maxConcept.name === "dog") {
                        const dogResponses = ["可愛い犬ですね", "かっこいい犬ですね", "犬は苦手です"];
                        responseText = getRandomResponse(dogResponses);
                    } else if (maxConcept.name === "cat") {
                        const catResponses = ["可愛い猫ですね", "かっこいい猫ですね", "猫は苦手です"];
                        responseText = getRandomResponse(catResponses);
                    } else {
                        const otherResponses = ["これはなんですか？", "知らない画像です", "わかりません"];
                        responseText = getRandomResponse(otherResponses);
                    }
                    
                    res.send(responseText);
                }
            );
        });
    };

    robot.respond('file', (res) => {  // ファイルがアップロードされたときの処理
        onfile(res, res.json);
    });
};
