import React, { useState } from 'react';
import './EurUsdPredictionPage.css';
import axios from 'axios';

export default function EurUsdPredictionPage() {
    const [rate, setRate] = useState('');
    const [date, setDate] = useState('');
    const [okResult, setOkResult] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handlePredict = async () => {
        try {
            setError(null);
            setLoading(true);

            const response = await axios.get(
                'https://backend-fastapi.vercel.app/api/eur-usd'
            );

            console.log(response);

            setRate(response.data.rate);
            setDate(response.data.timestamp);
            setOkResult(response ? true : false);

        } catch (err) {
            setError('Failed to fetch prediction. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="eur-usd-prediction-page">
            <div className="container">
                <h1>EUR/USD Frankfurter exchange rate</h1>

                <div className="form-group">
                    <label>Date:</label>
                    <input type="text" value={date} readOnly />
                </div>

                <div className="form-group">
                    <label>Exchange Rate:</label>
                    <input type="text" value={rate} readOnly />
                </div>

                <button onClick={handlePredict} disabled={loading}>
                    {loading ? 'Predicting...' : 'Predict'}
                </button>

                {error && <p className="error-message">{error}</p>}
            </div>
        </section>
    );
}
