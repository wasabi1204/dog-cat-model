const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const fs = require("fs");

const stub = ClarifaiStub.grpc();

const metadata = new grpc.Metadata();
const api_key = "5654b2812fd44f61a85e7543a89faa27";
metadata.set("authorization", "Key " + api_key);

const threshold = 0.8;  // スコアのしきい値を設定

const onfile = (res, file) => {
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

                // スコアに基づいて感想を決定する
                let result = "わからない";
                const concepts = response.outputs[0].data.concepts;

                // Cat と Dog のスコアを取得
                const catConcept = concepts.find(concept => concept.name === "cat");
                const dogConcept = concepts.find(concept => concept.name === "dog");

                if (catConcept && catConcept.value > threshold && (catConcept.value > (dogConcept ? dogConcept.value : 0))) {
                    result = "猫";
                } else if (dogConcept && dogConcept.value > threshold && (dogConcept.value > (catConcept ? catConcept.value : 0))) {
                    result = "犬";
                }
                
                res.send(result);
            }
        );
    });
};

module.exports = (robot) => {
    robot.respond('file', (res) => {  // ファイルがアップロードされたときの処理
        onfile(res, res.json);
    });
};
