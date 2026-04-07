using LMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LMS.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(LmsDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (await context.Users.AnyAsync()) return;

        // Seed Admin user
        var admin = new User
        {
            Username = "admin",
            Email = "admin@lms.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = "Admin",
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(admin);

        // Seed Student user
        var student = new User
        {
            Username = "student1",
            Email = "student@lms.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123"),
            Role = "Student",
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(student);

        // Seed Course
        var course = new Course
        {
            Title = "Full-Stack Developer Bootcamp",
            Description = "A comprehensive 2-week bootcamp covering TypeScript, Angular, .NET Core, and SQL Server. Learn to build production-ready web applications.",
            TechStack = "TypeScript, Angular 19, .NET 8, SQL Server",
            DurationDays = 14,
            HoursPerDay = 8
        };
        context.Courses.Add(course);
        await context.SaveChangesAsync();

        // Seed Day 1 - TypeScript Fundamentals
        var day1Module1 = new Module
        {
            CourseId = course.Id,
            Title = "TypeScript Fundamentals",
            Description = "Introduction to TypeScript: types, interfaces, and modern JavaScript features",
            DayNumber = 1,
            OrderIndex = 1
        };
        var day1Module2 = new Module
        {
            CourseId = course.Id,
            Title = "TypeScript Advanced Types",
            Description = "Generics, union types, intersection types, and type guards",
            DayNumber = 1,
            OrderIndex = 2
        };
        context.Modules.AddRange(day1Module1, day1Module2);
        await context.SaveChangesAsync();

        var lesson1 = new Lesson
        {
            ModuleId = day1Module1.Id,
            Title = "Introduction to TypeScript",
            Content = @"# Introduction to TypeScript

TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.

## Why TypeScript?

- **Static typing** catches errors at compile time
- **Better IDE support** with intelligent code completion
- **Enhanced readability** through explicit type annotations
- **Modern JavaScript features** compiled to older JavaScript

## Setting Up TypeScript

```bash
npm install -g typescript
tsc --init
```

## Your First TypeScript Program

TypeScript adds optional static types to JavaScript. Here's a simple example:

```typescript
// Without types (JavaScript)
function greet(name) {
  return 'Hello, ' + name;
}

// With types (TypeScript)
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet('World'));
```

## Basic Types

TypeScript includes several basic types:
- `string`: Text values
- `number`: Numeric values (integers and floats)
- `boolean`: true/false
- `any`: Opt out of type checking
- `void`: No value (used for functions that don't return)
- `null` and `undefined`
- `never`: Values that never occur

## Type Inference

TypeScript can often infer types automatically:

```typescript
let message = 'Hello'; // TypeScript infers string
let count = 42;        // TypeScript infers number
let isValid = true;    // TypeScript infers boolean
```

## Variable Declarations

Use `let` and `const` instead of `var`:

```typescript
const PI = 3.14159;          // Immutable
let counter: number = 0;     // Mutable with explicit type
let name = 'John';           // Mutable with inferred type
```",
            CodeExample = @"// TypeScript Fundamentals Practice

// 1. Basic type annotations
let firstName: string = 'Alice';
let age: number = 30;
let isStudent: boolean = true;

// 2. Function with typed parameters and return type
function calculateBMI(weight: number, height: number): number {
    return weight / (height * height);
}

// 3. Optional parameters
function greetUser(name: string, title?: string): string {
    if (title) {
        return `Hello, ${title} ${name}!`;
    }
    return `Hello, ${name}!`;
}

// 4. Array types
const scores: number[] = [95, 87, 92, 78, 88];
const names: Array<string> = ['Alice', 'Bob', 'Charlie'];

// 5. Tuple types
const coordinate: [number, number] = [10, 20];
const person: [string, number] = ['Alice', 30];

console.log(greetUser('Smith', 'Dr'));
console.log(`BMI: ${calculateBMI(70, 1.75).toFixed(2)}`);",
            LessonType = "Theory",
            OrderIndex = 1,
            EstimatedMinutes = 60
        };

        var lesson2 = new Lesson
        {
            ModuleId = day1Module1.Id,
            Title = "TypeScript Interfaces and Types",
            Content = @"# TypeScript Interfaces and Types

Interfaces define the shape of objects in TypeScript. They are one of TypeScript's core features for defining contracts in your code.

## Interfaces

```typescript
interface User {
    id: number;
    name: string;
    email: string;
    age?: number; // Optional property
    readonly createdAt: Date; // Read-only property
}
```

## Type Aliases

Type aliases create a new name for a type:

```typescript
type Point = {
    x: number;
    y: number;
};

type StringOrNumber = string | number; // Union type
type ID = string | number;
```

## Interface vs Type

Both can describe objects, but:
- Interfaces can be extended with `extends`
- Types can create union and intersection types
- Interfaces can be declared multiple times (declaration merging)

## Extending Interfaces

```typescript
interface Animal {
    name: string;
    sound(): string;
}

interface Dog extends Animal {
    breed: string;
    fetch(): void;
}
```

## Implementing Interfaces

```typescript
class GoldenRetriever implements Dog {
    name: string;
    breed: string = 'Golden Retriever';

    constructor(name: string) {
        this.name = name;
    }

    sound(): string { return 'Woof!'; }
    fetch(): void { console.log(`${this.name} fetches the ball!`); }
}
```",
            CodeExample = @"// Interface Practice

interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    inStock?: boolean;
}

interface CartItem extends Product {
    quantity: number;
    discount?: number;
}

function calculateCartTotal(items: CartItem[]): number {
    return items.reduce((total, item) => {
        const itemPrice = item.price * item.quantity;
        const discountAmount = item.discount ? itemPrice * (item.discount / 100) : 0;
        return total + itemPrice - discountAmount;
    }, 0);
}

const cart: CartItem[] = [
    { id: 1, name: 'TypeScript Book', price: 39.99, category: 'Books', quantity: 2, discount: 10 },
    { id: 2, name: 'VS Code Laptop Sticker', price: 4.99, category: 'Accessories', quantity: 5 }
];

console.log(`Cart Total: $${calculateCartTotal(cart).toFixed(2)}`);",
            LessonType = "Theory",
            OrderIndex = 2,
            EstimatedMinutes = 60
        };

        var lesson3 = new Lesson
        {
            ModuleId = day1Module2.Id,
            Title = "TypeScript Generics",
            Content = @"# TypeScript Generics

Generics allow you to create reusable components that work with multiple types.

## Basic Generics

```typescript
function identity<T>(arg: T): T {
    return arg;
}

let result1 = identity<string>('Hello');
let result2 = identity<number>(42);
let result3 = identity('TypeScript'); // Type inference
```

## Generic Interfaces

```typescript
interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
    timestamp: Date;
}

interface User {
    id: number;
    name: string;
}

const userResponse: ApiResponse<User> = {
    data: { id: 1, name: 'Alice' },
    status: 200,
    message: 'Success',
    timestamp: new Date()
};
```

## Generic Constraints

```typescript
interface HasLength {
    length: number;
}

function getLength<T extends HasLength>(arg: T): number {
    return arg.length;
}

getLength('Hello');     // 5
getLength([1, 2, 3]);  // 3
```

## Generic Classes

```typescript
class Stack<T> {
    private items: T[] = [];

    push(item: T): void {
        this.items.push(item);
    }

    pop(): T | undefined {
        return this.items.pop();
    }

    peek(): T | undefined {
        return this.items[this.items.length - 1];
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }
}
```",
            CodeExample = @"// Generics Practice

// Generic repository pattern
interface Repository<T> {
    findById(id: number): T | undefined;
    findAll(): T[];
    save(item: T): void;
    delete(id: number): void;
}

interface Student {
    id: number;
    name: string;
    grade: number;
}

class InMemoryRepository<T extends { id: number }> implements Repository<T> {
    private items: T[] = [];

    findById(id: number): T | undefined {
        return this.items.find(item => item.id === id);
    }

    findAll(): T[] {
        return [...this.items];
    }

    save(item: T): void {
        const index = this.items.findIndex(i => i.id === item.id);
        if (index >= 0) {
            this.items[index] = item;
        } else {
            this.items.push(item);
        }
    }

    delete(id: number): void {
        this.items = this.items.filter(item => item.id !== id);
    }
}

const studentRepo = new InMemoryRepository<Student>();
studentRepo.save({ id: 1, name: 'Alice', grade: 95 });
studentRepo.save({ id: 2, name: 'Bob', grade: 87 });
console.log(studentRepo.findAll());",
            LessonType = "Practical",
            OrderIndex = 1,
            EstimatedMinutes = 90
        };

        context.Lessons.AddRange(lesson1, lesson2, lesson3);
        await context.SaveChangesAsync();

        // Add more days/modules
        // Day 2 - Angular Fundamentals
        var day2Module = new Module
        {
            CourseId = course.Id,
            Title = "Angular 19 Fundamentals",
            Description = "Introduction to Angular: components, templates, and data binding",
            DayNumber = 2,
            OrderIndex = 1
        };
        context.Modules.Add(day2Module);
        await context.SaveChangesAsync();

        var lesson4 = new Lesson
        {
            ModuleId = day2Module.Id,
            Title = "Angular Components and Templates",
            Content = @"# Angular Components and Templates

Angular is a platform and framework for building single-page client applications using HTML and TypeScript.

## Core Concepts

- **Components**: The building blocks of Angular applications
- **Templates**: Define what renders in the browser
- **Directives**: Extend HTML functionality
- **Services**: Share data and logic across components
- **Modules**: Group related components and services

## Creating a Component

In Angular 19 with standalone architecture:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hello',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class=""hello-container"">
      <h1>Hello, {{ name }}!</h1>
      <p>Welcome to Angular {{ version }}</p>
    </div>
  `,
  styles: [`
    .hello-container {
      padding: 20px;
      background: #f0f0f0;
    }
  `]
})
export class HelloComponent {
  name = 'World';
  version = 19;
}
```

## Data Binding Types

1. **Interpolation**: `{{ expression }}`
2. **Property binding**: `[property]=""expression""`
3. **Event binding**: `(event)=""handler()""`
4. **Two-way binding**: `[(ngModel)]=""property""`

## Template Directives

```html
<!-- Structural directives -->
@if (isLoggedIn) {
  <p>Welcome back!</p>
}

@for (item of items; track item.id) {
  <li>{{ item.name }}</li>
}

@switch (userRole) {
  @case ('admin') { <admin-panel /> }
  @case ('student') { <student-dashboard /> }
}
```",
            CodeExample = @"// Angular Component Example

import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class=""todo-app"">
      <h2>Todo List ({{ completedCount() }}/{{ todos().length }})</h2>

      <div class=""add-todo"">
        <input [(ngModel)]=""newTodo"" placeholder=""Add a task..."">
        <button (click)=""addTodo()"">Add</button>
      </div>

      @for (todo of todos(); track todo.id) {
        <div class=""todo-item"" [class.completed]=""todo.completed"">
          <input type=""checkbox""
                 [checked]=""todo.completed""
                 (change)=""toggleTodo(todo.id)"">
          <span>{{ todo.text }}</span>
          <button (click)=""removeTodo(todo.id)"">x</button>
        </div>
      }
    </div>
  `
})
export class TodoComponent {
  todos = signal<TodoItem[]>([]);
  newTodo = '';

  completedCount = computed(() =>
    this.todos().filter(t => t.completed).length
  );

  addTodo() {
    if (this.newTodo.trim()) {
      this.todos.update(items => [...items, {
        id: Date.now(),
        text: this.newTodo.trim(),
        completed: false
      }]);
      this.newTodo = '';
    }
  }

  toggleTodo(id: number) {
    this.todos.update(items =>
      items.map(t => t.id === id ? {...t, completed: !t.completed} : t)
    );
  }

  removeTodo(id: number) {
    this.todos.update(items => items.filter(t => t.id !== id));
  }
}",
            LessonType = "Theory",
            OrderIndex = 1,
            EstimatedMinutes = 90
        };
        context.Lessons.Add(lesson4);
        await context.SaveChangesAsync();

        // Seed Tests for lessons
        var test1 = new Test
        {
            LessonId = lesson1.Id,
            Title = "TypeScript Basics Quiz",
            PassingScore = 70
        };
        context.Tests.Add(test1);
        await context.SaveChangesAsync();

        var questions1 = new List<Question>
        {
            new Question { TestId = test1.Id, Text = "What is the correct way to declare a typed variable in TypeScript?", OrderIndex = 1 },
            new Question { TestId = test1.Id, Text = "Which of the following is NOT a primitive type in TypeScript?", OrderIndex = 2 },
            new Question { TestId = test1.Id, Text = "What does the 'readonly' modifier do in TypeScript?", OrderIndex = 3 },
            new Question { TestId = test1.Id, Text = "What is 'type inference' in TypeScript?", OrderIndex = 4 },
            new Question { TestId = test1.Id, Text = "Which keyword creates a constant that cannot be reassigned?", OrderIndex = 5 }
        };
        context.Questions.AddRange(questions1);
        await context.SaveChangesAsync();

        var answers1 = new List<Answer>
        {
            // Q1
            new Answer { QuestionId = questions1[0].Id, Text = "let name = string 'John'", IsCorrect = false },
            new Answer { QuestionId = questions1[0].Id, Text = "let name: string = 'John'", IsCorrect = true },
            new Answer { QuestionId = questions1[0].Id, Text = "string name = 'John'", IsCorrect = false },
            new Answer { QuestionId = questions1[0].Id, Text = "var name: 'John'", IsCorrect = false },
            // Q2
            new Answer { QuestionId = questions1[1].Id, Text = "string", IsCorrect = false },
            new Answer { QuestionId = questions1[1].Id, Text = "number", IsCorrect = false },
            new Answer { QuestionId = questions1[1].Id, Text = "boolean", IsCorrect = false },
            new Answer { QuestionId = questions1[1].Id, Text = "object", IsCorrect = true },
            // Q3
            new Answer { QuestionId = questions1[2].Id, Text = "Makes the property required", IsCorrect = false },
            new Answer { QuestionId = questions1[2].Id, Text = "Prevents the property from being modified after initialization", IsCorrect = true },
            new Answer { QuestionId = questions1[2].Id, Text = "Makes the property private", IsCorrect = false },
            new Answer { QuestionId = questions1[2].Id, Text = "Makes the property optional", IsCorrect = false },
            // Q4
            new Answer { QuestionId = questions1[3].Id, Text = "The process of explicitly declaring types", IsCorrect = false },
            new Answer { QuestionId = questions1[3].Id, Text = "TypeScript automatically determining types from values", IsCorrect = true },
            new Answer { QuestionId = questions1[3].Id, Text = "Converting one type to another", IsCorrect = false },
            new Answer { QuestionId = questions1[3].Id, Text = "Importing types from external libraries", IsCorrect = false },
            // Q5
            new Answer { QuestionId = questions1[4].Id, Text = "var", IsCorrect = false },
            new Answer { QuestionId = questions1[4].Id, Text = "let", IsCorrect = false },
            new Answer { QuestionId = questions1[4].Id, Text = "const", IsCorrect = true },
            new Answer { QuestionId = questions1[4].Id, Text = "final", IsCorrect = false },
        };
        context.Answers.AddRange(answers1);

        var test2 = new Test
        {
            LessonId = lesson2.Id,
            Title = "Interfaces and Types Quiz",
            PassingScore = 70
        };
        context.Tests.Add(test2);
        await context.SaveChangesAsync();

        var questions2 = new List<Question>
        {
            new Question { TestId = test2.Id, Text = "How do you make a property optional in a TypeScript interface?", OrderIndex = 1 },
            new Question { TestId = test2.Id, Text = "What keyword is used for a class to implement an interface?", OrderIndex = 2 },
            new Question { TestId = test2.Id, Text = "How do you extend an interface in TypeScript?", OrderIndex = 3 },
            new Question { TestId = test2.Id, Text = "What is a union type in TypeScript?", OrderIndex = 4 },
        };
        context.Questions.AddRange(questions2);
        await context.SaveChangesAsync();

        var answers2 = new List<Answer>
        {
            new Answer { QuestionId = questions2[0].Id, Text = "Add '!' after the property name", IsCorrect = false },
            new Answer { QuestionId = questions2[0].Id, Text = "Add '?' after the property name", IsCorrect = true },
            new Answer { QuestionId = questions2[0].Id, Text = "Add 'optional' before the type", IsCorrect = false },
            new Answer { QuestionId = questions2[0].Id, Text = "Wrap the type in Optional<>", IsCorrect = false },
            new Answer { QuestionId = questions2[1].Id, Text = "extends", IsCorrect = false },
            new Answer { QuestionId = questions2[1].Id, Text = "implements", IsCorrect = true },
            new Answer { QuestionId = questions2[1].Id, Text = "inherits", IsCorrect = false },
            new Answer { QuestionId = questions2[1].Id, Text = "uses", IsCorrect = false },
            new Answer { QuestionId = questions2[2].Id, Text = "interface B implements A {}", IsCorrect = false },
            new Answer { QuestionId = questions2[2].Id, Text = "interface B extends A {}", IsCorrect = true },
            new Answer { QuestionId = questions2[2].Id, Text = "interface B inherits A {}", IsCorrect = false },
            new Answer { QuestionId = questions2[2].Id, Text = "interface B : A {}", IsCorrect = false },
            new Answer { QuestionId = questions2[3].Id, Text = "A type that combines two types with all properties", IsCorrect = false },
            new Answer { QuestionId = questions2[3].Id, Text = "A type that can be one of several types (string | number)", IsCorrect = true },
            new Answer { QuestionId = questions2[3].Id, Text = "A type that requires exactly one type", IsCorrect = false },
            new Answer { QuestionId = questions2[3].Id, Text = "A type alias for function types", IsCorrect = false },
        };
        context.Answers.AddRange(answers2);

        await context.SaveChangesAsync();
    }
}
