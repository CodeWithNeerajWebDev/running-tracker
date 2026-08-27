function calculateBMI() {
    let weight = document.getElementById("weight").value;
    let height = document.getElementById("height").value;
    let bmi = weight / (height * height);
    alert("your BMI is: " + bmi.toFixed(2));
}