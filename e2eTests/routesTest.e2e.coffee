describe 'angularjs homepage', ->
  it 'has an about page with my name', ->
    browser.get 'http://localhost:9000/#/about'

    expect($('#author-name').getText()).toEqual 'Riley Eynon-Lynch'

  it 'has a home page with the title of the app', ->
    browser.get 'http://localhost:9000'

    expect($('#app-title').getText()).toEqual 'Amazing Bus Route Navigator!'