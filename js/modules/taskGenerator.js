// =============== TASK GENERATOR MODULE ===============

import { createSeededRandom, findDivisors } from './utils.js';

function generateAddSubtractOnly(rng) {
  const numOperations = Math.floor(rng() * 3) + 3;
  let expression = '';
  let result = 0;
  
  let num = Math.floor(rng() * 71) + 30;
  expression = num.toString();
  result = num;
  
  for (let j = 1; j < numOperations; j++) {
    num = Math.floor(rng() * 30) + 1;
    
    if (rng() > 0.5 || result - num < 0) {
      expression += ` + ${num}`;
      result += num;
    } else {
      expression += ` - ${num}`;
      result -= num;
    }
  }
  
  return {
    task: `Oblicz: ${expression} = ?`,
    answer: result.toString()
  };
}

function generateMultiplicationOnly(rng) {
  const type = Math.floor(rng() * 3);
  
  if (type === 0) {
    const a = Math.floor(rng() * 9) + 2;
    const b = Math.floor(rng() * 9) + 2;
    const c = Math.floor(rng() * 30) + 5;
    
    return {
      task: `Oblicz: ${a} × ${b} + ${c} = ?`,
      answer: (a * b + c).toString()
    };
  } else if (type === 1) {
    const b = Math.floor(rng() * 8) + 2;
    const quotient = Math.floor(rng() * 12) + 3;
    const a = b * quotient;
    const c = Math.floor(rng() * 20) + 5;
    
    return {
      task: `Oblicz: ${a} ÷ ${b} + ${c} = ?`,
      answer: (quotient + c).toString()
    };
  } else {
    const a = Math.floor(rng() * 8) + 2;
    const b = Math.floor(rng() * 8) + 2;
    const c = Math.floor(rng() * 6) + 2;
    const d = Math.floor(rng() * 6) + 2;
    
    return {
      task: `Oblicz: ${a} × ${b} + ${c} × ${d} = ?`,
      answer: (a * b + c * d).toString()
    };
  }
}

function generateArithmetic(rng) {
  const useMultiplication = rng() > 0.7;
  
  if (useMultiplication) {
    return generateMultiplicationOnly(rng);
  } else {
    return generateAddSubtractOnly(rng);
  }
}

function generateMultiplication(rng) {
  const type = rng() > 0.5 ? 'multiply' : 'divide';
  
  if (type === 'multiply') {
    const a = Math.floor(rng() * 9) + 2;
    const b = Math.floor(rng() * 9) + 2;
    const c = Math.floor(rng() * 9) + 2;
    
    return {
      task: `Oblicz: ${a} × ${b} + ${c} × ${a} = ?`,
      answer: (a * b + c * a).toString()
    };
  } else {
    const divisor = Math.floor(rng() * 8) + 2;
    const quotient = Math.floor(rng() * 10) + 5;
    const dividend = divisor * quotient;
    const extra = Math.floor(rng() * 20) + 10;
    
    return {
      task: `Oblicz: ${dividend} ÷ ${divisor} + ${extra} = ?`,
      answer: (quotient + extra).toString()
    };
  }
}

function generateWordProblem(rng) {
  const problems = [
    {
      template: (a, b, c) => `Iron Man ma ${a} modułów broni, a War Machine ma o ${b} więcej. Razem użyli ${c} modułów. Ile modułów im zostało?`,
      answer: (a, b, c) => a + (a + b) - c
    },
    {
      template: (a, b, c) => `Czarna Wdowa obezwładniła ${a} robotów. Hawkeye zniszczył ${b} razy więcej, ale ${c} się naprawiło. Ile robotów jest unieruchomionych?`,
      answer: (a, b, c) => a + a * b - c
    },
    {
      template: (a, b, c) => `Kapitan Ameryka ewakuował ${a} ludzi, potem następnych ${b} grup po ${c} osób. Ile osób uratował?`,
      answer: (a, b, c) => a + b * c
    },
    {
      template: (a, b) => `Hulk skoczył ${a} razy na wysokość ${b} metrów. Jaka jest suma wysokości wszystkich skoków?`,
      answer: (a, b) => a * b
    },
    {
      template: (a, b, c) => `Thor ma ${a} błyskawic. Podzielił je równo między ${b} robotów po ${c} błyskawice każdemu. Ile błyskawic zostało Thorowi?`,
      answer: (a, b, c) => a - (b * c)
    }
  ];
  
  const problem = problems[Math.floor(rng() * problems.length)];
  
  let a, b, c, result;
  
  do {
    a = Math.floor(rng() * 50) + 20;
    b = Math.floor(rng() * 8) + 2;
    c = Math.floor(rng() * 10) + 5;
    result = problem.answer(a, b, c);
  } while (result < 0 || result > 500);
  
  return {
    task: problem.template(a, b, c),
    answer: result.toString()
  };
}

function generateGeometry(rng) {
  const type = rng() > 0.5 ? 'perimeter' : 'area';
  
  if (type === 'perimeter') {
    const a = Math.floor(rng() * 15) + 5;
    const b = Math.floor(rng() * 15) + 5;
    
    return {
      task: `Prostokąt ma długość ${a} cm i szerokość ${b} cm. Oblicz jego obwód (w cm).`,
      answer: (2 * (a + b)).toString()
    };
  } else {
    const a = Math.floor(rng() * 12) + 4;
    const b = Math.floor(rng() * 12) + 4;
    
    return {
      task: `Prostokąt ma długość ${a} m i szerokość ${b} m. Oblicz jego pole (w m²). Wpisz tylko liczbę.`,
      answer: (a * b).toString()
    };
  }
}

function generateUnits(rng) {
  const unitTypes = [
    {
      question: (n) => `Ile centymetrów to ${n} metrów?`,
      answer: (n) => n * 100
    },
    {
      question: (n) => `Ile gramów to ${n} kilogramów?`,
      answer: (n) => n * 1000
    },
    {
      question: (n) => `${n * 100} cm to ile metrów?`,
      answer: (n) => n
    },
    {
      question: (n) => `Ile minut to ${n} godzin?`,
      answer: (n) => n * 60
    },
    {
      question: (n) => `${n * 60} minut to ile godzin?`,
      answer: (n) => n
    }
  ];
  
  const unit = unitTypes[Math.floor(rng() * unitTypes.length)];
  const n = Math.floor(rng() * 8) + 2;
  
  return {
    task: unit.question(n),
    answer: unit.answer(n).toString()
  };
}

function generatePattern(rng) {
  const step = Math.floor(rng() * 8) + 2;
  const start = Math.floor(rng() * 20) + 5;
  
  const sequence = [start];
  for (let i = 0; i < 4; i++) {
    sequence.push(sequence[sequence.length - 1] + step);
  }
  
  const answer = sequence[4];
  sequence.pop();
  
  return {
    task: `Jaką liczbę należy wpisać: ${sequence.join(', ')}, ?`,
    answer: answer.toString()
  };
}

function generateComparison(rng) {
  const a = Math.floor(rng() * 30) + 10;
  const b = Math.floor(rng() * 15) + 5;
  const c = Math.floor(rng() * 10) + 2;
  
  const left = a + b;
  const right = a + c;
  const difference = Math.abs(left - right);
  
  return {
    task: `O ile większe jest ${a} + ${b} od ${a} + ${c}?`,
    answer: difference.toString()
  };
}

function generateRoman(rng) {
  const romanNumerals = [
    { value: 5, roman: 'V' },
    { value: 10, roman: 'X' },
    { value: 15, roman: 'XV' },
    { value: 20, roman: 'XX' },
    { value: 25, roman: 'XXV' },
    { value: 30, roman: 'XXX' },
    { value: 40, roman: 'XL' },
    { value: 50, roman: 'L' }
  ];
  
  const num1 = romanNumerals[Math.floor(rng() * romanNumerals.length)];
  const num2 = romanNumerals[Math.floor(rng() * Math.min(4, romanNumerals.length))];
  
  const type = rng() > 0.5 ? 'add' : 'subtract';
  
  if (type === 'add') {
    return {
      task: `Oblicz i podaj wynik cyframi arabskimi: ${num1.roman} + ${num2.roman} = ?`,
      answer: (num1.value + num2.value).toString()
    };
  } else {
    if (num1.value > num2.value) {
      return {
        task: `Oblicz i podaj wynik cyframi arabskimi: ${num1.roman} - ${num2.roman} = ?`,
        answer: (num1.value - num2.value).toString()
      };
    } else {
      return {
        task: `Oblicz i podaj wynik cyframi arabskimi: ${num1.roman} + ${num2.roman} = ?`,
        answer: (num1.value + num2.value).toString()
      };
    }
  }
}

export function generateMathTasks(seed, numTasks = 3) {
  const rng = createSeededRandom(seed);
  const tasks = [];
  const answers = [];
  
  const taskTypes = [
    'arithmetic',
    'multiplication',
    'wordProblem',
    'geometry',
    'units',
    'pattern',
    'comparison',
    'roman'
  ];
  
  const selectedTypes = [];
  while (selectedTypes.length < numTasks) {
    const type = taskTypes[Math.floor(rng() * taskTypes.length)];
    if (!selectedTypes.includes(type) || numTasks > taskTypes.length) {
      selectedTypes.push(type);
    }
  }
  
  for (let i = 0; i < numTasks; i++) {
    const taskType = selectedTypes[i];
    let task, answer;
    
    switch (taskType) {
      case 'arithmetic':
        ({ task, answer } = generateArithmetic(rng));
        break;
      case 'multiplication':
        ({ task, answer } = generateMultiplication(rng));
        break;
      case 'wordProblem':
        ({ task, answer } = generateWordProblem(rng));
        break;
      case 'geometry':
        ({ task, answer } = generateGeometry(rng));
        break;
      case 'units':
        ({ task, answer } = generateUnits(rng));
        break;
      case 'pattern':
        ({ task, answer } = generatePattern(rng));
        break;
      case 'comparison':
        ({ task, answer } = generateComparison(rng));
        break;
      case 'roman':
        ({ task, answer } = generateRoman(rng));
        break;
      default:
        ({ task, answer } = generateArithmetic(rng));
    }
    
    tasks.push(task);
    answers.push(answer);
  }
  
  return { tasks, answers };
}