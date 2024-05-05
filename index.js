const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 3000

const app = express()
//middleware
app.use(cors())
app.use(express.json())


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
        await client.connect();

        const servicesCollection = client.db('carDoctor').collection('services')
        const bookingCollection = client.db('carDoctor').collection('booking')

        app.get('/services', async (req,res)=>{
            const cursor = servicesCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })
        
        app.get('/service/:id' , async(req,res)=>{
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const options = {
                projection:{title:1 , price:1, img:1}
            }
            const result = await servicesCollection.findOne(query,options)
            res.send(result)
        })

        app.post('/booking', async(req,res)=>{
            const order = req.body;
            const result = await bookingCollection.insertOne(order)
            console.log(result)
            res.send(result)

        })
        app.get('/booking', async(req,res)=>{
            let query = {}
            if(req.query?.email){
                query ={email : req.query.email}
            }
            const result = await bookingCollection.find(query).toArray()
            res.send(result)

        })

        app.delete('/booking/:id', async(req,res)=>{
            const id =req.params
            const query = {_id: new ObjectId(id)}
            const result = await bookingCollection.deleteOne(query)
            res.send(result)
        })

        app.patch('/booking/:id', async(req,res)=>{
            const updatedBooking = req.body
            const id = req.params
            const filter = {_id:new ObjectId(id)}
            const updateDoc={
                $set:{
                    status:updatedBooking.status
                }
            }
            const result = await bookingCollection.updateOne(filter,updateDoc)
            res.send(result)

        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
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