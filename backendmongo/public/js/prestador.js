const urlBase = window.location.href.replace(/\/[^\/]*$/,'')+'/api'
const access_token = localStorage.getItem('token') || null
const resultadoModal = new bootstrap.Modal(document.getElementById('modalMessage'))

async function carregaPrestadores(){
    const tabela = document.getElementById('dadosTabela')
    tabela.innerHTML = '' //limpa antes de recarregar
    //Faremos a requisição GET para a nossa API REST
    await fetch(`${urlBase}/prestadores`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/java',
            'access-token': access_token
        }
    })
    .then(response => response.json())
    .then(data => {
        //console.table(data)
        data.forEach(prestador =>
            tabela.innerHTML += `
            <tr>
              <td>${prestador.razao_social}</td>
              <td>${prestador.nome_fantasia}</td>
              <td>${prestador.cnae_fiscal}</td>
              <td>${new Date(prestador.data_inicio_atividade).toLocaleDateString()}</td>
              <td>${prestador.localizacao.coordinates[0]} / ${prestador.
              localizacao.coordinates[1]}</td>
              <td>
              <button class='btn btn-danger btn-sm' onclick='removePrestador("${prestador._id}")'>🗑 Excluir </button>
              </td>
            </tr>
            `)
    })
}

async function removePrestador(id){
    if(confirm('Deseja realmente excluir este prestador?')){
        await fetch(`${urlBase}/prestadores/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/java',
                'access-token': access_token
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.deletedCount > 0){
                carregaPrestadores() //atualizamos a UI
            }
        })
        .catch(error => {
            document.getElementById('mensagem').innerHTML = `Erro ao remover o
            prestador: ${error.message}`
            resultadoModal.show() //exibe o modal com o erro
        })
    }
}
document.getElementById('formPrestador').addEventListener('submit', function
(event){
    event.preventDefault() // evita o recarregamento
    let prestador = {} // Objeto prestador
    prestador = {
        "cnpj": document.getElementById('cnpj1').value,
        "razao_social": document.getElementById('razao-social2').value,
        "nome_fantasia": document.getElementById('nome-fantasia3').value,
        "cnae_fiscal": document.getElementById('cnae14').value,
        "data_inicio_atividade": document.getElementById('data-de-inicio-da-atividade16').value,
        "localizacao": {
            "type": "Point",
            "coordinates": [document.getElementById('latitude11').value,
                            document.getElementById('longitude12').value]
        },
        "cep": document.getElementById('cep5').value,
        "endereco":{
            "logradouro": document.getElementById('logradouro6').value,
            "complemento": document.getElementById('complemento9').value,
            "bairro": document.getElementById('bairro7').value,
            "localidade": document.getElementById('localidade8').value,
            "uf": document.getElementById('unidade-da-federacao10').value
        }
    } /* fim do objeto 
    alert(JSON.stringify(prestador)) //apenas para testes */
    salvaPrestador(prestador)
})

async function salvaPrestador(prestador){
    await fetch(`${urlBase}/prestadores`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access-token': access_token
        },
        body: JSON.stringify(prestador)
    })
    .then(response => response.json())
    .then(data => {
        if (data.acknowledged) {
            alert('Prestador incluído com sucesso!')
            //limpamos o formulário
            document.getElementById('formPrestador').reset()
            //atualizamos a listagem
            carregaPrestadores()
        } else if (data.errors){
            const errorMessages = data.errors.map(error => error.msg).join('\n')
            document.getElementById('mensagem').innerHTML = `<span class='text-danger'>${errorMessages}</span>`
            resultadoModal.show() // Mostra o modal
        }
    })

}