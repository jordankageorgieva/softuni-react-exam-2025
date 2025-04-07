export default function CreateUpdatePage({
    project,
    handleFileChange,
    preview
}) {
    return (<>
        <label htmlFor="leg-title">Project Client:</label>
        <input type="text" id="title" name="title" placeholder="Enter project title..." defaultValue={project.title}/>

        <label htmlFor="category">Project Category:</label>
        <input type="text" id="category" name="category" placeholder="Enter project category..." defaultValue={project.category}/>
        <label htmlFor="game-img">Project Image:</label>
        {handleFileChange ?            
            <input type="file" accept="image/*" onChange={handleFileChange} />
            : <input type="text" id="imageUrl" name="imageUrl" placeholder="Enter image URL..." defaultValue={project.imageUrl}/>
        }
        {preview && <img src={preview} alt="Preview" style={{ width: "200px", marginTop: "10px" }} />}

        <label htmlFor="summary">Overview:</label>
        <textarea name="summary" id="summary" defaultValue={project.summary}></textarea>

        <label htmlFor="environment">Technical environment:</label>
        <textarea name="environment" id="environment" defaultValue={project.environment}></textarea>
    </>);
};