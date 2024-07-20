const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const fs = require("fs");

const stub = ClarifaiStub.grpc();

const metadata = new grpc.Metadata();
const api_key = "5654b2812fd44f61a85e7543a89faa27";
metadata.set("authorization", "Key " + api_key);

module.exports = (robot) => {
    const onfile = (res, file) => {
        res.download(file, (path) => {
            try {
                // 画像ファイルをBase64形式で読み込み
                const imageBytes = fs.readFileSync(path, { encoding: "base64" });

                stub.PostModelOutputs(
                    {
                        model_id: "dog-catmodel",  // 使用するモデルID
                        inputs: [{ data: { image: { base64: imageBytes } } }]
                    },
                    metadata,
                    (err, response) => {
                        if (err) {
                            res.send("Error: " + err);  // エラー時のレスポンス
                            return;
                        }

                        if (response.status.code !== 10000) {
                            res.send(`Received failed status: ${response.status.description} \nDetails: ${response.status.details} \nCode: ${response.status.code}`);
                            return;
                        }

                        // 結果の処理
                        let result = "";
                        if (response.outputs && response.outputs[0] && response.outputs[0].data && response.outputs[0].data.concepts) {
                            for (const c of response.outputs[0].data.concepts) {
                                result += `${c.name}: ${c.value}\n`;
                            }
                        } else {
                            result = "No concepts found in response.";
                        }
                        res.send(result);
                    }
                );
            } catch (error) {
                res.send("Error reading file: " + error.message);
            }
        });
    };

    robot.respond('file', (res) => {
        onfile(res, res.json);  // `res.json`がファイルパスであることを確認
    });
};
