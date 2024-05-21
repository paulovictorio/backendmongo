const urlBase = window.location.href.replace(/\/[^\/]*$/,'')+'/api'

document.getElementById('formLogin').addEventListener('submit', function(event) {
            event.preventDefault() //evita o recarregamento da página
            const msgModal = new bootstrap.Modal(document.getElementById('modalMensagem'))
            //Obtendo os dados do formulário
            const login = document.getElementById('login').value
            const senha = document.getElementById('senha').value
            //Criando o objeto de autenticação
            const dadosLogin = {
                email: login,
                senha: senha
            }
            //Efetuar o POST para o endpoint de login
            fetch(`${urlBase}/usuarios/login`, {
                method: 'POST',
                headers: {"Content-type": "application/json"},
                body: JSON.stringify(dadosLogin)
            })
            .then(response => response.json())
            .then(data => {
                //Verifica se o token foi retornado
                if(data.access_token){
                    //Armazenamos o token no LocalStorage
                    localStorage.setItem('token', data.access_token)
                    window.location.href = 'menu.html'
                } else if(data.errors) {
                    //Vamos pegar os erros da API
                    const errorMessages = data.errors.map(error => error.msg).join('</br>')
                    //Alteramos a mensagem no modal
                    document.getElementById('mensagem').innerHTML = `<span class='text-danger'>${errorMessages}</span>`
                }
                msgModal.show()
            })
        })