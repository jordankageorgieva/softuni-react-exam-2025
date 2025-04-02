import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../hookContext/userContext';
import gameServices from '../../services/gameServices';
import './CreatePage.css';

import { useNavigate } from 'react-router';

import { openDB } from "idb"; // IndexedDB helper

const DB_NAME = "imageDB";

export default function CreatePage() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [savedImage, setSavedImage] = useState(null);

    const navigate = useNavigate();
    const { accessToken } = useContext(UserContext);

    const submitAction = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        let result = null;

        try {
            // Create the project in the backend
            result = await gameServices.create(data, accessToken);
            console.log(result);

            const _id = result._id; // Get the ID of the created project

            // Save the image in IndexedDB
            if (selectedFile) {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64Image = reader.result;

                    const STORE_NAME = `image${_id}`; // Name of the object store

                    const db = await openDB(DB_NAME, 1, {
                        upgrade(db) {
                            if (!db.objectStoreNames.contains(STORE_NAME)) {
                                db.createObjectStore(STORE_NAME); // Create object store
                            }
                        },
                    });

                    await db.put(STORE_NAME, base64Image, "uploadedImage");

                    setSavedImage(base64Image); // Display stored image
                    alert("Image uploaded and saved in IndexedDB!");
                };

                reader.readAsDataURL(selectedFile); // Convert the file to Base64
            }

            navigate('/projects');
        } catch (error) {
            console.error('Error creating game:', error);
        }
    };

    // Handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file)); // Temporary preview
        }
    };

    return (
        <>
            {/* <!-- Create Page ( Only for logged-in users ) --> */}
            <section id="create-page" className="auth">
                <form id="create" onSubmit={submitAction}>
                    <div className="container">

                        <h1>Insert Project</h1>
                        <label htmlFor="leg-title">Client:</label>
                        <input type="text" id="title" name="title" placeholder="Enter project title..." />

                        <label htmlFor="category">Category:</label>
                        <input type="text" id="category" name="category" placeholder="Enter project category..." />

                        <input type="file" accept="image/*" onChange={handleFileChange} />
                        {preview && <img src={preview} alt="Preview" style={{ width: "200px", marginTop: "10px" }} />}

                        <label htmlFor="summary">Summary:</label>
                        <textarea name="summary" id="summary"></textarea>

                        <label htmlFor="environment">Technical environment:</label>
                        <textarea name="environment" id="environment"></textarea>
                        <input className="btn submit" type="submit" value="Create Project" />
                    </div>
                </form>
            </section>
        </>
    );
}