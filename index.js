const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 3000

const app = express()
//middleware
app.use(cookieParser())
app.use(cors({
    origin: ['https://car-doctor-e6a38.web.app', 'https://car-doctor-e6a38.firebaseapp.com', 'http://localhost:5173'],
    credentials: true
}))
app.use(express.json())

//my middlewares
const logger = (req, res, next) => {
    console.log('log info:', req.method, req.url);
    next()
}
const verifyUser = (req, res, next) => {
    const token = req.cookies.token
    if (!token) {
        return res.status(401).send({ message: "unauthorized access" })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "unauthorized" })
        }
        else {
            req.user = decoded;
            next()
        }
    })
}

const cookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    secure: process.env.NODE_ENV === 'production' ? true : false
}


const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.xweyicz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const servicesCollection = client.db('carDoctor').collection('services')
        const bookingCollection = client.db('carDoctor').collection('booking')

        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { title: 1, price: 1, img: 1 }
            }
            const result = await servicesCollection.findOne(query, options)
            res.send(result)
        })


        //booking
        app.post('/booking', async (req, res) => {
            const order = req.body;
            const result = await bookingCollection.insertOne(order)
            console.log(result)
            res.send(result)

        })
        app.get('/booking', logger, verifyUser, async (req, res) => {
            console.log('value in valid token:', req.user);
            if (req.user.email !== req.query.email) {
                return res.status(403).send('forbidden')
            }
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray()
            res.send(result)

        })

        app.delete('/booking/:id', async (req, res) => {
            const id = req.params
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query)
            res.send(result)
        })

        app.patch('/booking/:id', async (req, res) => {
            const updatedBooking = req.body
            const id = req.params
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                }
            }
            const result = await bookingCollection.updateOne(filter, updateDoc)
            res.send(result)

        })

        //JWT
        app.post('/jwt', async (req, res) => {
            const user = req.body
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            })
            res
                .cookie('token', token, cookieOptions)
                .send(token)
        })
        app.post('/logout', async (req, res) => {
            const user = req.body
            res.clearCookie('token', { ...cookieOptions,maxAge:0}).send({ success: true })
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('CAR DOCTOR SERVER IS RUNNING')
})

app.listen(port, () => {
    console.log('CAR DOCTOR SERVER RUNNING ON', port)
})