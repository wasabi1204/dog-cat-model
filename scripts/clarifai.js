const Clarifai = require('clarifai');
const axios = require('axios');

const app = new Clarifai.App({
    apiKey: '5654b2812fd44f61a85e7543a89faa27'  // ClarifaiのAPIキーを入力
});

module.exports = (robot) => {
    robot.respond(/(.+)$/, async (res) => {
        const message = res.message;

        // メッセージのテキスト部分をJSONとしてパース
        let attachment;
        try {
            attachment = JSON.parse(message.text.match(/\{.*\}/)[0]);
        } catch (err) {
            console.error('Failed to parse message text as JSON:', err);
            res.send('画像の情報を解析できませんでした。');
            return;
        }

        // 画像URLを取得
        const imageUrl = attachment.url;

        // デバッグ用に画像URLをログ出力
        console.log('Image URL:', imageUrl);

        try {
            // 画像のダウンロード処理
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer', headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' } });
            const imageBytes = Buffer.from(response.data, 'binary').toString('base64');

            // 画像をClarifai APIで解析
            const clarifaiResponse = await app.models.predict("dog-catmodel", { base64: imageBytes });
            const concepts = clarifaiResponse.outputs[0].data.concepts;

            if (concepts.length > 0) {
                const topConcept = concepts[0].name;
                res.send(`これは${topConcept}の画像ですね。`);
            } else {
                res.send('画像の内容を認識できませんでした。');
            }
        } catch (err) {
            console.error('Error during image processing:', err);
            res.send('画像の解析に失敗しました。');
        }
    });
};
