import { useState } from 'react'
import { Button, CircularProgress, IconButton, Stack } from '@mui/material'
import { Delete, PhotoCamera, Save } from '@mui/icons-material'

function App () {
  const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState([])
  const [srcVideo, setSrcVideo] = useState('')
  const [isDisabled, setIsDisabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const evtSeleccionarImagenes = async (evt) => {
    setSrcVideo('')
    const archivos = evt.target.files

    const imagenesList = await Promise.all(
      Array.from(archivos).map((archivo) => {
        return new Promise((resolve, reject) => {
          const lector = new window.FileReader()
          lector.readAsDataURL(archivo)
          lector.onload = () => resolve(lector.result)
          lector.onerror = (error) => reject(error)
        })
      })
    )
    setImagenesSeleccionadas((p) => [...p, ...imagenesList])
  }

  const evtRemoverImagen = (indice) => {
    setImagenesSeleccionadas((p) => p.filter((_, i) => i !== indice))
  }

  const evtSubirImagenes = async () => {
    return imagenesSeleccionadas.map(async (imagen) => {
      const base64 = await fetch(imagen)
      const blobImagen = await base64.blob()
      const extension = blobImagen.type.split('/')[1]

      const formData = new window.FormData()
      const nombreArchivo = `${new Date().getTime()}.${extension}`
      formData.append('imagen', blobImagen, nombreArchivo)

      const response = await fetch('http://localhost:8080/video/cargar/imagen', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        return await response.text()
      } else {
        const error = await response.text()
        console.log(error)
      }
    })
  }

  const evtGenerarVideo = async () => {
    setIsLoading(true)
    setIsDisabled(true)
    const promesas = await evtSubirImagenes()
    const imagenesSubidas = await Promise.all(promesas)

    const requestBody = JSON.stringify(imagenesSubidas)
    const response = await fetch('http://localhost:8080/video/generar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requestBody
    })

    if (response.ok) {
      const data = await response.text()
      console.log(data)
      setSrcVideo('http://localhost:8080/video/stream/generado.mp4?v=' + new Date().getTime())
      setIsDisabled(false)
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Stack justifyContent='center' alignContent='center' spacing={2}>
        <input accept='image/*' id='imagen-carga' type='file' multiple style={{ display: 'none' }} onChange={evtSeleccionarImagenes} />
        <label htmlFor='imagen-carga'>
          <Button variant='contained' component='span' startIcon={<PhotoCamera />}>
            Adjuntar imágenes
          </Button>
        </label>
        <Stack direction='row' spacing={2} justifyContent='center' alignItems='center'>
          {imagenesSeleccionadas.map((imagen, index) => (
            <div key={index}>
              <img src={imagen} alt='imagen' width='100' />
              <IconButton aria-label='Eliminar' onClick={() => evtRemoverImagen(index)}>
                <Delete />
              </IconButton>
            </div>
          ))}
        </Stack>
        {imagenesSeleccionadas.length > 0 && (
          <Button disabled={isDisabled} variant='contained' component='span' startIcon={<Save />} onClick={evtGenerarVideo}>
            Generar Video
          </Button>
        )}
        {isLoading
          ? (
            <CircularProgress />)
          : ((srcVideo && imagenesSeleccionadas.length > 0) && (
            <video src={srcVideo} controls autoPlay width='500' type='video/mp4' />)
            )}
      </Stack>
    </div>
  )
}

export default App
