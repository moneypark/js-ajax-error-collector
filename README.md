# JS-AJAX-ERROR-COLLECTOR

## Abstract

This singleton will add hooks to Javascript and Ajax errors so that it is possible to intercept and expose them in the window object. This is especially useful for Selenium tests, since Selenium can't access the clients console. The collected errors can be retrieved as an array by calling the `getJsErrorCollection` method in the `window` scope.

Everything in this script is as unobtrusive as possible, so that its inclusion does not lead to any behavioral changes on the page which includes it, which means:

* Script does no changes to DOM
* It has no kind of dependencies to any event/promise (only to the clients native `window` and `XMLHttpRequest` object)
* Every piece of code is wrapped within a try-catch block

## Install with bower

```bash
bower install js-ajax-error-collector
```

## Usage in Selenium tests

```python
errors = driver.execute_script('return window.getJsErrorCollection();')
```

