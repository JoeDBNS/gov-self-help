

// OnLoad Run
window.addEventListener('load', function() {
    switch (window.location.pathname.replace('/gov-self-help', '').toLowerCase()) {
        case '/':
        case '/index.html':
            InitSelfHelpMenu();
            break;

        case '/other-help.html':
            InitFormListeners();
            SetupFormFieldMasks();
            break;

        default:
            break;
    }
});


function SetupFormFieldMasks() {
    var mask_phone = IMask(
        document.getElementById('phone'), {
            mask: '(000) 000-0000'
        });
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
        if (this.readyState === 4 && this.status === 200) {
            UpdateFormDisplay(form, 'success');

            let response = JSON.parse(this.responseText);
            console.log(response);
        }
        else {
            UpdateFormDisplay(form, 'error');
        }
    };

    request.open('POST', url);
    request.send();

    UpdateFormDisplay(form, 'loading');
}


function UpdateFormDisplay(form, request_status_code) {
    if (request_status_code === 'loading') {
        console.log('loading');
        // document.querySelector('[data-form-loading-target=' + form.getAttribute('id') + ']').classList.add('form-loading-show');
    }
    else {
        console.log('loading stopped');
        // document.querySelector('[data-form-loading-target=' + form.getAttribute('id') + ']').classList.remove('form-loading-show');

        // form.hide();

        if (request_status_code === 'success') {
            // console.log('success');
            // document.querySelector('[data-form-results-target=' + form.getAttribute('id') + ']').classList.add('form-results-success');
            // document.querySelector('[data-form-results-target=' + form.getAttribute('id') + '] .results-success').focus();
        }
        else {
            // console.log('error');
            // document.querySelector('[data-form-results-target=' + form.getAttribute('id') + ']').classList.add('form-results-fail');
            // document.querySelector('[data-form-results-target=' + form.getAttribute('id') + '] .results-fail').focus();
        }
    }
}