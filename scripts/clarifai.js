
const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const fs = require("fs");

const stub = ClarifaiStub.grpc();

const metadata = new grpc.Metadata();
const api_key = "5654b2812fd44f61a85e7543a89faa27";
metadata.set("authorization", "Key " + api_key);

module.exports = (robot) => {
    const onfile = (res, file) => {
        res.download(file, (path) => {
            const imageBytes = fs.readFileSync(path, { encoding: "base64" }); // ファイルを読み込んでbase64エンコード
            stub.PostModelOutputs( // Clarifai APIの呼び出し
                {
                    // This is the model ID of a publicly available General model. You may use any other public or custom model ID.
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

                    //これ以降が正常な場合の処理
                    result = "";
                    for (const c of response.outputs[0].data.concepts) {
                        result = result + (c.name + ": " + c.value + "\n");
                    }
                    res.send(result);
                }
            );
        });
    };

    robot.respond('file', (res) => {  // ファイルがアップロードされたときの処理
        onfile(res, res.json);
    });
};
