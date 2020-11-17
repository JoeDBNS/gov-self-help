

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
        if (input.parentElement.classList.contains('input-set-required')) {
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
        if (input.parentElement.classList.contains('input-set-required') || input.hasAttribute('data-regex-check')) {
            if (EvaluateFormField(input)) {
                passed_inputs.push(input);
            }
            else {
                failed_inputs.push(input);
            }
        }
    });

    return [failed_inputs, passed_inputs];
}


function EvaluateFormField(field) {
    if (field.type !== 'file' && field.type !== 'radio') {
        if (field.value === '') {
            field.parentElement.getElementsByTagName('label')[0].classList.add('formatLabelIsNull');
        }
        else {
            field.parentElement.getElementsByTagName('label')[0].classList.remove('formatLabelIsNull');
            field.classList.remove('inputFailed');
        }
    }

    if (field.type === 'tel') {
        if (field.value !== '') {
            if (field.value.length !== 14) {
                field.classList.add('inputFailed');
            }
            else {
                field.classList.remove('inputFailed');
            }
        }
    }

    if (field.type === 'email') {
        if (field.value !== '') {
            if (CheckEmailRegex(field.value) !== true) {
                field.classList.add('inputFailed');
            }
        }
    }

    if (field.type === 'file') {
        if (field.value !== '') {
            if (field.files[0].size <= fileSizeLimit && ['image/png', 'image/gif', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/pdf'].includes(field.files[0].type)) {
                field.classList.remove('inputError');
                field.classList.remove('inputFailed');
            }
            else {
                field.value = '';
                field.classList.add('inputError');
            }
        }
    }

    if (field.type === 'radio') {
        try {
            document.querySelector('input[name="' + field.name + '"]:checked').value;
            field.parentElement.parentElement.parentElement.classList.remove('inputFailed');
        } catch (error) { }
    }
}


function CheckEmailRegex(chkEmail) {
    if (chkEmail) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(chkEmail);
    }
    else {
        return null;
    }
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
            MainVue.results = [];
            if (response.length > 0) {
                response.forEach(function(item) {
                    MainVue.results.push(item);
                });
            }
  
            MainVue.pending = false;
        }
        else {
            UpdateFormDisplay(form, 'error');
        }
    };

    // request.open('POST', url);
    // request.send()

    UpdateFormDisplay(form, 'loading');
}


function UpdateFormDisplay(form, request_status_code) {
    if (request_status_code === 'loading') {
        document.querySelector('[data-form-loading-target=' + form.getAttribute('id') + ']').classList.add('form-loading-show');
    }
    else {
        document.querySelector('[data-form-loading-target=' + form.getAttribute('id') + ']').classList.remove('form-loading-show');

        form.hide();

        if (request_status_code === 'success') {
            document.querySelector('[data-form-results-target=' + form.getAttribute('id') + ']').classList.add('form-results-success');
            document.querySelector('[data-form-results-target=' + form.getAttribute('id') + '] .results-success').focus();
        }
        else {
            document.querySelector('[data-form-results-target=' + form.getAttribute('id') + ']').classList.add('form-results-fail');
            document.querySelector('[data-form-results-target=' + form.getAttribute('id') + '] .results-fail').focus();
        }
    }
}










function EvaluateAndMarkFieldStatus(field) {
    if (field.type !== 'file' && field.type !== 'radio') {
        if (field.value === '') {
            field.parentElement.getElementsByTagName('label')[0].classList.add('formatLabelIsNull');
        }
        else {
            field.parentElement.getElementsByTagName('label')[0].classList.remove('formatLabelIsNull');
            field.classList.remove('inputFailed');
        }
    }

    if (field.type === 'tel') {
        if (field.value !== '') {
            if (field.value.length !== 14) {
                field.classList.add('inputFailed');
            }
            else {
                field.classList.remove('inputFailed');
            }
        }
    }

    if (field.type === 'email') {
        if (field.value !== '') {
            if (CheckEmailRegex(field.value) !== true) {
                field.classList.add('inputFailed');
            }
        }
    }

    if (field.type === 'file') {
        if (field.value !== '') {
            if (field.files[0].size <= fileSizeLimit && ['image/png', 'image/gif', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/pdf'].includes(field.files[0].type)) {
                field.classList.remove('inputError');
                field.classList.remove('inputFailed');
            }
            else {
                field.value = '';
                field.classList.add('inputError');
            }
        }
    }

    if (field.type === 'radio') {
        try {
            document.querySelector('input[name="' + field.name + '"]:checked').value;
            field.parentElement.parentElement.parentElement.classList.remove('inputFailed');
        } catch (error) { }
    }
}
function CheckRequiredFields() {
    var failedCount = 0;
    Array.from(document.getElementsByClassName('inputField')).forEach(function (element) {
        if ((!element.classList.contains('requiredInput') && element.value !== '') || element.classList.contains('requiredInput')) {
            if (element.type !== 'file' && element.type !== 'radio') {
                if (element.value === '') {
                    element.parentElement.getElementsByTagName('label')[0].classList.add('formatLabelIsNull');
                    element.classList.add('inputFailed');
                    failedCount += 1;
                }
                else {
                    element.parentElement.getElementsByTagName('label')[0].classList.remove('formatLabelIsNull');
                    element.classList.remove('inputFailed');
                }
            }
            if (element.type === 'tel') {
                if (element.value !== '') {
                    if (element.value.length !== 14) {
                        element.classList.add('inputFailed');
                        failedCount += 1;
                    }
                }
            }
            if (element.type === 'email') {
                if (element.value !== '') {
                    if (CheckEmailRegex(element.value) !== true) {
                        element.classList.add('inputFailed');
                        failedCount += 1;
                    }
                }
            }
            if (element.type === 'file') {
                if (element.value !== '') {
                    if (element.files[0].size <= fileSizeLimit && ['image/png', 'image/gif', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/pdf'].includes(element.files[0].type)) {
                        element.classList.remove('inputFailed');
                    }
                    else {
                        element.value = '';
                        element.classList.add('inputFailed');
                        failedCount += 1;
                    }
                }
                else {
                    element.classList.add('inputFailed');
                    failedCount += 1;
                }
            }
            if (element.type === 'radio') {
                try {
                    document.querySelector('input[name="' + element.name + '"]:checked').value;
                    element.parentElement.parentElement.parentElement.classList.remove('inputFailed');
                } catch (error) {
                    element.parentElement.parentElement.parentElement.classList.add('inputFailed');
                    failedCount += 1;
                }
            }
        }
    });

    return failedCount;
}
function CheckEmailRegex(chkEmail) {
    if (chkEmail) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(chkEmail);
    }
    else {
        return null;
    }
}
function initCaptcha() {
    grecaptcha.execute();
    document.getElementById('btnSubmit').classList.add('btnSubmitPending');
    document.getElementById('btnSubmitText').setAttribute('hidden', 'true');
    document.getElementById('btnSubmitLoading').removeAttribute('hidden');
}
function captchaPassed() {
    console.log('reCaptcha returned...');
    if (grecaptcha.getResponse() !== '') {
        console.log('reCaptcha passed!');
        document.getElementById('applicationForm').submit();
    }
    else {
        console.log('reCaptcha failed!');
    }
}