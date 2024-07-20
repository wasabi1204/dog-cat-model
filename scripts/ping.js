const Clarifai = require('clarifai');
const axios = require('axios');

const app = new Clarifai.App({
    apiKey: '5654b2812fd44f61a85e7543a89faa27'  // ClarifaiのAPIキーを入力
});

module.exports = (robot) => {
    robot.respond(/(.+)$/, (res) => {
        const message = res.message;

        if (message.attachments && message.attachments.length > 0 && message.attachments[0].type === 'image') {
            const imageUrl = message.attachments[0].url;

            // 画像のダウンロード処理
            const downloadImage = async (url) => {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                return Buffer.from(response.data, 'binary').toString('base64');
            };

            downloadImage(imageUrl).then(imageBytes => {
                app.models.predict("dog-catmodel", { base64: imageBytes }).then(
                    function (response) {
                        const concepts = response.outputs[0].data.concepts;
                        if (concepts.length > 0) {
                            const topConcept = concepts[0].name;
                            res.send(`これは${topConcept}の画像ですね。`);
                        } else {
                            res.send('画像の内容を認識できませんでした。');
                        }
                    },
                    function (err) {
                        console.error(err);
                        res.send('画像の解析に失敗しました。');
                    }
                );
            }).catch(err => {
                console.log("Error: " + err);
                res.send('画像のダウンロードに失敗しました。');
            });
        } else {
            res.send('画像を送信してください。');
        }
    });
};
