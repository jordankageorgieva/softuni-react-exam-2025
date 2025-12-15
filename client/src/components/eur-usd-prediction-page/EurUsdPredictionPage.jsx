import React, { useState } from 'react';
import './EurUsdPredictionPage.css';
import axios from 'axios';

export default function EurUsdPredictionPage() {
    const [inputData, setInputData] = useState({ date: '', rate: '' });
    const [prediction, setPrediction] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePredict = async () => {
        try {
            setError(null);
            const response = await axios.post('http://localhost:5000/predict', inputData);
            setPrediction(response.data.prediction);
        } catch (err) {
            setError('Failed to fetch prediction. Please try again.');
        }
    };

    return (
        <section id="eur-usd-prediction-page">
            <div className="container">
                <h1>EUR/USD Prediction</h1>
                <div className="form-group">
                    <label htmlFor="date">Date:</label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={inputData.date}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="rate">Exchange Rate:</label>
                    <input
                        type="number"
                        id="rate"
                        name="rate"
                        value={inputData.rate}
                        onChange={handleChange}
                    />
                </div>
                <button onClick={handlePredict}>Predict</button>

                {prediction && (
                    <div className="prediction-result">
                        <h2>Prediction:</h2>
                        <p>{prediction}</p>
                    </div>
                )}

                {error && <p className="error-message">{error}</p>}
            </div>
        </section>
    );
}