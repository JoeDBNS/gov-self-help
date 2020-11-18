

// OnLoad Run
window.addEventListener('load', function() {
    switch (window.location.pathname.toLowerCase().replace('/gov-self-help', '')) {
        case '/':
        case '/index.html':
            InitSelfHelpMenu();
            break;

        case '/other-help.html':
            if (CountCurrentCookies() < 2) {
                InitFormListeners();
                SetupFormFieldMasks();
            }
            else {
                UpdateFormDisplay(document.getElementById('form-other-support-inqueries'), 'max_submission');
                document.querySelector('[data-form-cookie-failure-target="form-other-support-inqueries"]').classList.add('form-results-show');
            }
            break;

        default:
            break;
    }
});

function SetupFormFieldMasks() {
    var mask_phone = IMask(
        document.getElementById('phone'), {
            mask: '(000) 000-0000'
        }
    );
}

function InitSelfHelpMenu() {
    Array.from(document.querySelectorAll('.help-topic .topic-header')).forEach((selected_topic) => {
        selected_topic.addEventListener('click', (event) => {
            var open_topic = document.querySelector('.help-topic-expanded');
            if (open_topic) {
                open_topic.classList.remove('help-topic-expanded');
            }

            if (open_topic !== selected_topic.parentElement) {
                selected_topic.parentElement.classList.add('help-topic-expanded');
            }
        });
    });
}

// Cookie management
function CreateCookie(values) {
    var date = new Date();
    var midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    document.cookie = values + '; expires=' + midnight.toGMTString();
}

function GetCookie(cookie_name) {
    var name = cookie_name + '=';
    var decoded_cookie = decodeURIComponent(document.cookie);
    var ca = decoded_cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

function CountCurrentCookies() {
    var cookie_total = 0;

    if (GetCookie('form_submitted_once') !== '') {
        cookie_total = cookie_total + 1;
    }
    if (GetCookie('form_submitted_twice') !== '') {
        cookie_total = cookie_total + 1;
    }

    return cookie_total;
}

function UpdateCookieSubCount() {
    if (GetCookie('form_submitted_once') === '') {
        CreateCookie('form_submitted_once=success');
    }
    else {
        if (GetCookie('form_submitted_twice') === '') {
            CreateCookie('form_submitted_twice=success');
        }
    }
}

// Forms related functions
function InitFormListeners() {
    if (document.querySelectorAll('[data-form-submit-target]').length) {
        Array.from(document.querySelectorAll('[data-form-submit-target]')).forEach(function(submit_buttom) {
            let form_submit_button = document.querySelector('[data-form-submit-target]');
            let form = document.querySelector('#' + form_submit_button.getAttribute('data-form-submit-target'));
            let form_inputs = document.querySelectorAll('#' + form.getAttribute('id') + ' input, ' + '#' + form.getAttribute('id') + ' textarea, ' + '#' + form.getAttribute('id') + ' select');

            SetupInputListeners(form_inputs);

            submit_buttom.addEventListener('click', function(event) {
                EvaluateFormSubmit(form, form_inputs);
            });
        });
    }
    else {
        return;
    }
}

function SetupInputListeners(form_inputs) {
    Array.from(form_inputs).forEach(function(input) {
        if (input.parentElement.classList.contains('input-set-required') || input.hasAttribute('data-regex-check')) {
            input.addEventListener('change', function(event) {
                if (input.value !== '') {
                    input.parentElement.classList.remove('input-set-failed');
                }
            });
        }
    });
}

function EvaluateFormSubmit(form, form_inputs) {
    let form_inputs_evaluated = SortFormFields(form_inputs);

    ProcessFormFields(form_inputs_evaluated[0], form_inputs_evaluated[1]);

    if (form_inputs_evaluated[0].length === 0) {
        let form_submit_json_string = BuildFormSubmitJson(form_inputs);
        ProcessFormSubmit(form, form_submit_json_string);
    }
}

function SortFormFields(form_inputs) {
    let failed_inputs = [];
    let passed_inputs = [];

    Array.from(form_inputs).forEach(function(input) {
        if (input.parentElement.classList.contains('input-set-required')) {
            if (input.value !== '') {
                if (input.hasAttribute('data-regex-check')) {
                    if (CheckFieldValueFormat(input, input.getAttribute('data-regex-check'))) {
                        passed_inputs.push(input);
                    }
                    else {
                        failed_inputs.push(input);
                    }
                }
                else {
                    passed_inputs.push(input);
                }
            }
            else {
                failed_inputs.push(input);
            }
        }
        else {
            if (input.hasAttribute('data-regex-check')) {
                if (input.value !== '') {
                    if (CheckFieldValueFormat(input, input.getAttribute('data-regex-check'))) {
                        passed_inputs.push(input);
                    }
                    else {
                        failed_inputs.push(input);
                    }
                }
                else {
                    passed_inputs.push(input);
                }
            }
        }
    });

    return [failed_inputs, passed_inputs];
}

function CheckFieldValueFormat(field, eval_as) {
    let regex_email_check = RegExp(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);
    let regex_phone_check = RegExp(/^.{14}$/);

    switch (eval_as) {
        case 'email':
            if (regex_email_check.test(field.value)) {
                return true;
            }
            else {
                return false;
            }
            break;

        case 'tel':
            if (regex_phone_check.test(field.value)) {
                return true;
            }
            else {
                return false;
            }
            break;
    
        default:
            return true;
            break;
    }
}

function ProcessFormFields(failed_inputs, passed_inputs) {
    if (failed_inputs.length > 0) {
        failed_inputs[0].focus();
    }

    Array.from(failed_inputs).forEach(function(failed) {
        failed.parentElement.classList.add('input-set-failed');
    });

    Array.from(passed_inputs).forEach(function(passed) {
        passed.parentElement.classList.remove('input-set-failed');
    });
}

function BuildFormSubmitJson(form_inputs) {
    let form_value_json = {};

    Array.from(form_inputs).forEach(function(input) {
        if (input.type === 'checkbox') {
            form_value_json[input.getAttribute('data-db-field-name')] = input.checked;
        }
        else {
            form_value_json[input.getAttribute('data-db-field-name')] = input.value;
        }
    });

    return JSON.stringify(form_value_json);
}

function ProcessFormSubmit(form, form_submit_json_string) {
    let url = 'https://gov011mcrmda501.mieog.state.mi.us/GovUI/SaveJsonLog?JsonLogData=' + encodeURI(form_submit_json_string);

    let request = new XMLHttpRequest();

    request.onreadystatechange = function() {
        if (request.readyState === XMLHttpRequest.DONE) {
            var status = request.status;
            if (status === 0 || (status >= 200 && status < 400)) {
                UpdateFormDisplay(form, 'success');
                UpdateCookieSubCount();
            }
            else {
                UpdateFormDisplay(form, 'error');
            }
        }
    };

    request.open('POST', url);
    request.send();

    UpdateFormDisplay(form, 'loading');
}

function UpdateFormDisplay(form, request_status_code) {
    if (request_status_code === 'loading') {
        Array.from(document.querySelectorAll('[data-hide-on-submit]')).forEach(function(element) {
            element.setAttribute('hidden', 'true');
        });

        document.querySelector('[data-form-loading-target=' + form.getAttribute('id') + ']').classList.add('form-loading-show');
    }
    else {
        document.querySelector('[data-form-loading-target=' + form.getAttribute('id') + ']').classList.remove('form-loading-show');

        if (request_status_code === 'success') {
            form.setAttribute('hidden', 'true');

            document.querySelector('[data-form-results-target=' + form.getAttribute('id') + ']').classList.add('form-results-show');
            document.querySelector('[data-form-results-target=' + form.getAttribute('id') + '] .results-success').focus();
        }
        if (request_status_code === 'error') {
            Array.from(document.querySelectorAll('[data-hide-on-submit]')).forEach(function(element) {
                element.removeAttribute('hidden');
            });

            console.error('There was an error in processing your request. Please try again later.');
            alert('There was an error in processing your request. Please try again later.')
        }
        if (request_status_code === 'max_submission') {
            form.setAttribute('hidden', 'true');
        }
    }
}