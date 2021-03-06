# tatva.js
Tatva (Sanskrit word "तत्त्व", meaning "Element") is a Web Component Framework.

## Installation
**NPM**
```bash
npm i tatva
```
**CDN**
```javascript
import { Component, h, text } from "https://unpkg.com/tatva@latest";

// your code
```

## Todo App Example
```javascript
import { Component, h, text } from "https://unpkg.com/tatva@latest";

class TodoApp extends Component {

    state = {
        todo: '',
        todos: []
    }

    setTodo(todo) {
        this.setState(state => ({
            ...state,
            todo
        }))
    }

    addTodo(id, todo) {
        this.setState(state => ({ 
            ...state, 
            todos: [...this.state.todos, { id, todo }],
            todo: ''
        }))
    }

    removeTodo(todoId) {
        this.setState(state => ({
            ...state,
            todos: this.state.todos.filter(({ id }) => id !== todoId)
        }));
    }

    handleFormSubmit(e) {
        e.preventDefault();

        this.addTodo(crypto.randomUUID(), this.state.todo);
    }

    render() {
        return (
            h('main', {},
                h('form', { onsubmit: e => this.handleFormSubmit(e) },
                    h('input', {
                        oninput: e => this.setTodo(e.target.value),
                        placeholder: 'Enter Todo',
                        value: this.state.todo
                    })
                ),
                !this.state.todos.length
                    ? h('p', {}, text('No Todos.'))
                    : h('ul', {},
                        ...this.state.todos.map(({ id, todo }) => 
                            h('li', { key: id },
                                text(todo),
                                h('button', 
                                    { onclick: () => this.removeTodo(id) }, 
                                    text('Remove')
                                )
                            )
                        )
                    )
            )
        )
    }

}

customElements.define('todo-app', TodoApp);
```