export default function CreateUpdatePage({
    project,
    handleFileChange,
    preview
}) {
    return (<>
        <label htmlFor="leg-title">Project Client:</label>
        {(project && project.title) ?
            <input type="text" id="title" name="title" placeholder="Enter project title..." defaultValue={project.title} />
            :
            <input type="text" id="title" name="title" placeholder="Enter project title..." />
        }
        <label htmlFor="category">Project Category:</label>
        {(project && project.category) ?
            <input type="text" id="category" name="category" placeholder="Enter project category..." defaultValue={project.category} />
            :
            <input type="text" id="category" name="category" placeholder="Enter project category..." />
        }
        <label htmlFor="game-img">Project Image:</label>
        {(project && project.imageUrl) ?
            <input type="text" id="imageUrl" name="imageUrl" placeholder="Enter image URL..." defaultValue={project.imageUrl} />
            : <input type="text" id="imageUrl" name="imageUrl" placeholder="Enter image URL..."  />
        }
        {preview && <img src={preview} alt="Preview" style={{ width: "200px", marginTop: "10px" }} />}

        <label htmlFor="summary">Overview:</label>
        {(project && project.summary) ?
            <textarea name="summary" id="summary" defaultValue={project.summary}></textarea>
            :
            <textarea name="summary" id="summary" ></textarea>
        }


        <label htmlFor="environment">Technical environment:</label>
        {( project  && project.environment) ?
            <textarea name="environment" id="environment" defaultValue={project.environment}></textarea>
            :
            <textarea name="environment" id="environment" ></textarea>
        }

    </>);
};