const Clarifai = require('clarifai');
const axios = require('axios');

// 画像のURLとアクセストークンを設定
const imageUrl = 'https://api.direct4b.com/albero-app-server/files/-12Kax5oAsNWRZT/1t1OW3zTVvk?message_id=1584143806524030976';
const token = '5654b2812fd44f61a85e7543a89faa27'; // 正しいトークンを使用

// 画像データを取得するリクエスト
axios.get(imageUrl, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
    },
    responseType: 'arraybuffer' // バイナリデータとしてレスポンスを処理
})
.then(response => {
    console.log('Image data received');
    // ここで画像データの処理を行う
})
.catch(error => {
    console.error('Error during image processing:', error);
});

const app = new Clarifai.App({
    apiKey: '5654b2812fd44f61a85e7543a89faa27'  // ClarifaiのAPIキー
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
            const response = await axios.get(imageUrl, { 
                responseType: 'arraybuffer', 
                headers: { 
                    'Authorization': 'Bearer 5654b2812fd44f61a85e7543a89faa27', // ここを修正
                    'Accept': 'application/json' 
                } 
            });

            // 画像データをBase64形式に変換
            const imageBytes = Buffer.from(response.data, 'binary').toString('base64');

            // 画像をClarifai APIで解析
            const clarifaiResponse = await app.models.predict('dog-catmodel', { base64: imageBytes });
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
