import axios from 'axios';
import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [brand, setBrand] = useState([]);

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/phones")
      setBrand(res.data)
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <>
      <h1>All phone Brand</h1>
      {
        brand.map((item, index) => {
          const { id, brand, phone } = item;
          return (
            <div key={index}>
              <p>{id}---{brand}---{phone}</p>
            </div>
          )
        })
      }
    </>
  )
}

export default App
