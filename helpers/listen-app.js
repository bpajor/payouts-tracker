import mongoose from "mongoose"

const URI = `mongodb+srv://pejdzor:6Km0lLIVhe6q93pv@payoutscluster.q9zysai.mongodb.net/payoutsDB`

export const appListen = async (app) => {
    try {
        let connResult = await mongoose.connect(URI);
        app.listen(3000);
    }
    catch (err) {
        console.log(err)
    }
    
}