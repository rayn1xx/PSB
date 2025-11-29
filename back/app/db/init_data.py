"""
Скрипт для инициализации тестовых данных в БД.
Запускается при старте приложения, если данных еще нет.
"""
import asyncio
from datetime import datetime, timedelta, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import SecurityManager
from app.db.models import (
    User, UserProfile, NotificationSettings,
    Course, StudentCourse, Module, Material, MaterialProgress,
    Assignment, Submission, SubmissionFile,
    Test, TestQuestion, TestAttempt,
    ChatChannel, Message,
    Notification
)
from app.db.session import AsyncSessionLocal


# Тестовые данные для учеников
STUDENTS_DATA = [
    {
        "email": "student1@example.com",
        "password": "student123",
        "first_name": "Иван",
        "last_name": "Петров",
        "group": "ИТ-21-1",
        "university": "Московский государственный университет",
        "phone": "+7 (999) 123-45-67",
        "timezone": "Europe/Moscow"
    },
    {
        "email": "student2@example.com",
        "password": "student123",
        "first_name": "Мария",
        "last_name": "Сидорова",
        "group": "ИТ-21-2",
        "university": "Санкт-Петербургский государственный университет",
        "phone": "+7 (999) 234-56-78",
        "timezone": "Europe/Moscow"
    },
    {
        "email": "student3@example.com",
        "password": "student123",
        "first_name": "Алексей",
        "last_name": "Иванов",
        "group": "ИТ-21-1",
        "university": "Московский государственный университет",
        "phone": "+7 (999) 345-67-89",
        "timezone": "Europe/Moscow"
    }
]

# Данные для учителя
TEACHER_DATA = {
    "email": "teacher@example.com",
    "password": "teacher123",
    "first_name": "Дмитрий",
    "last_name": "Смирнов",
    "role": "teacher"
}


async def create_test_users(session: AsyncSession):
    """Создает тестовых пользователей (учеников и учителя)"""
    teacher = None
    students = []
    
    # Проверяем и создаем учителя
    teacher_result = await session.execute(select(User).where(User.email == TEACHER_DATA["email"]))
    teacher = teacher_result.scalar_one_or_none()
    
    if not teacher:
        teacher = User(
            email=TEACHER_DATA["email"],
            password_hash=SecurityManager.get_password_hash(TEACHER_DATA["password"]),
            first_name=TEACHER_DATA["first_name"],
            last_name=TEACHER_DATA["last_name"],
            role="teacher"
        )
        session.add(teacher)
        await session.flush()
        
        # Создаем профиль и настройки для учителя
        teacher_profile = UserProfile(user_id=teacher.id)
        teacher_settings = NotificationSettings(user_id=teacher.id)
        session.add(teacher_profile)
        session.add(teacher_settings)
    
    # Создаем учеников
    for student_data in STUDENTS_DATA:
        student_result = await session.execute(select(User).where(User.email == student_data["email"]))
        student = student_result.scalar_one_or_none()
        
        if not student:
            student = User(
                email=student_data["email"],
                password_hash=SecurityManager.get_password_hash(student_data["password"]),
                first_name=student_data["first_name"],
                last_name=student_data["last_name"],
                group=student_data["group"],
                university=student_data["university"],
                phone=student_data["phone"],
                timezone=student_data["timezone"],
                role="student"
            )
            session.add(student)
            await session.flush()
            
            # Создаем профиль и настройки
            profile = UserProfile(user_id=student.id)
            settings = NotificationSettings(user_id=student.id)
            session.add(profile)
            session.add(settings)
            
            students.append(student)
        else:
            students.append(student)
    
    await session.commit()
    print(f"Создано: 1 учитель, {len(students)} учеников")
    return teacher


async def create_test_courses(session: AsyncSession, teacher: User):
    """Создает тестовые курсы"""
    result = await session.execute(select(Course))
    existing_courses = result.scalars().all()
    if existing_courses:
        print("Курсы уже существуют, пропускаем создание")
        return existing_courses
    
    courses = []
    
    # Курс 1: Python для начинающих
    course1 = Course(
        title="Python для начинающих",
        description="Изучение основ программирования на Python. Включает синтаксис, структуры данных, функции и основы ООП.",
        teacher_id=teacher.id,
        status="active"
    )
    session.add(course1)
    await session.flush()
    courses.append(course1)
    
    # Курс 2: Веб-разработка на FastAPI
    course2 = Course(
        title="Веб-разработка на FastAPI",
        description="Создание современных веб-приложений с использованием FastAPI, SQLAlchemy и PostgreSQL.",
        teacher_id=teacher.id,
        status="active"
    )
    session.add(course2)
    await session.flush()
    courses.append(course2)
    
    # Курс 3: Алгоритмы и структуры данных
    course3 = Course(
        title="Алгоритмы и структуры данных",
        description="Изучение основных алгоритмов, структур данных и их применение в решении задач.",
        teacher_id=teacher.id,
        status="active"
    )
    session.add(course3)
    await session.flush()
    courses.append(course3)
    
    await session.commit()
    print(f"Создано {len(courses)} курсов")
    return courses


async def enroll_students_in_courses(session: AsyncSession, students: list[User], courses: list[Course]):
    """Зачисляет учеников на курсы"""
    for student in students:
        for course in courses:
            # Проверяем, не зачислен ли уже
            result = await session.execute(
                select(StudentCourse).where(
                    StudentCourse.student_id == student.id,
                    StudentCourse.course_id == course.id
                )
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                student_course = StudentCourse(
                    student_id=student.id,
                    course_id=course.id,
                    progress=0.0,
                    status="active"
                )
                session.add(student_course)
    
    await session.commit()
    print("Ученики зачислены на курсы")


async def create_modules_and_materials(session: AsyncSession, courses: list[Course]):
    """Создает модули и материалы для курсов"""
    now = datetime.now(timezone.utc)
    
    for course in courses:
        if course.title == "Python для начинающих":
            # Модуль 1: Введение
            module1 = Module(
                course_id=course.id,
                title="Введение в Python",
                description="Основы языка Python, установка и настройка окружения",
                order=1
            )
            session.add(module1)
            await session.flush()
            
            materials = [
                Material(module_id=module1.id, title="Установка Python и настройка окружения", 
                        description="Как установить Python и настроить рабочее окружение",
                        type="text", content_text="Python можно установить с официального сайта python.org. Рекомендуется использовать Python 3.11 или новее...", order=1),
                Material(module_id=module1.id, title="Первая программа на Python", 
                        description="Видеоурок по созданию первой программы",
                        type="video", content_url="https://example.com/video/python-intro.mp4", order=2),
                Material(module_id=module1.id, title="Интерактивная оболочка Python", 
                        type="text", content_text="Python имеет интерактивную оболочку для быстрого тестирования кода...", order=3),
                Material(module_id=module1.id, title="Практика: Hello World", 
                        type="file", content_url="https://example.com/files/hello_world.py", order=4),
            ]
            for m in materials:
                session.add(m)
            
            # Модуль 2: Переменные и типы
            module2 = Module(
                course_id=course.id,
                title="Переменные и типы данных",
                description="Изучение переменных и основных типов данных в Python",
                order=2
            )
            session.add(module2)
            await session.flush()
            
            materials = [
                Material(module_id=module2.id, title="Переменные в Python", 
                        type="text", content_text="Переменные используются для хранения данных. В Python не нужно объявлять тип переменной...", order=1),
                Material(module_id=module2.id, title="Типы данных: числа, строки, списки", 
                        type="video", content_url="https://example.com/video/python-types.mp4", order=2),
                Material(module_id=module2.id, title="Работа со строками", 
                        type="text", content_text="Строки в Python - это последовательности символов. Можно использовать одинарные или двойные кавычки...", order=3),
                Material(module_id=module2.id, title="Списки и операции с ними", 
                        type="video", content_url="https://example.com/video/python-lists.mp4", order=4),
            ]
            for m in materials:
                session.add(m)
            
            # Модуль 3: Условия и циклы
            module3 = Module(
                course_id=course.id,
                title="Условия и циклы",
                description="Условные операторы и циклы в Python",
                order=3
            )
            session.add(module3)
            await session.flush()
            
            materials = [
                Material(module_id=module3.id, title="Условные операторы if/else", 
                        type="text", content_text="Условные операторы позволяют выполнять код в зависимости от условий...", order=1),
                Material(module_id=module3.id, title="Циклы for и while", 
                        type="video", content_url="https://example.com/video/python-loops.mp4", order=2),
            ]
            for m in materials:
                session.add(m)
            
        elif course.title == "Веб-разработка на FastAPI":
            # Модуль 1
            module1 = Module(
                course_id=course.id,
                title="Введение в FastAPI",
                description="Основы создания API с FastAPI",
                order=1
            )
            session.add(module1)
            await session.flush()
            
            materials = [
                Material(module_id=module1.id, title="Что такое FastAPI", 
                        type="text", content_text="FastAPI - современный фреймворк для создания API на Python. Основан на Starlette и Pydantic...", order=1),
                Material(module_id=module1.id, title="Создание первого API", 
                        type="video", content_url="https://example.com/video/fastapi-intro.mp4", order=2),
                Material(module_id=module1.id, title="Установка и настройка FastAPI", 
                        type="text", content_text="Установка: pip install fastapi uvicorn. Запуск: uvicorn main:app --reload", order=3),
            ]
            for m in materials:
                session.add(m)
            
            # Модуль 2
            module2 = Module(
                course_id=course.id,
                title="Роутинг и параметры запросов",
                description="Работа с маршрутами и параметрами",
                order=2
            )
            session.add(module2)
            await session.flush()
            
            materials = [
                Material(module_id=module2.id, title="GET, POST, PUT, DELETE endpoints", 
                        type="text", content_text="FastAPI поддерживает все HTTP методы...", order=1),
                Material(module_id=module2.id, title="Параметры пути и запроса", 
                        type="video", content_url="https://example.com/video/fastapi-params.mp4", order=2),
            ]
            for m in materials:
                session.add(m)
            
        elif course.title == "Алгоритмы и структуры данных":
            # Модуль 1
            module1 = Module(
                course_id=course.id,
                title="Введение в алгоритмы",
                description="Основные понятия алгоритмов",
                order=1
            )
            session.add(module1)
            await session.flush()
            
            materials = [
                Material(module_id=module1.id, title="Что такое алгоритм", 
                        type="text", content_text="Алгоритм - это последовательность шагов для решения задачи...", order=1),
                Material(module_id=module1.id, title="Сложность алгоритмов", 
                        type="text", content_text="Временная и пространственная сложность. Big O нотация...", order=2),
                Material(module_id=module1.id, title="Примеры простых алгоритмов", 
                        type="video", content_url="https://example.com/video/algorithms-intro.mp4", order=3),
            ]
            for m in materials:
                session.add(m)
            
            # Модуль 2
            module2 = Module(
                course_id=course.id,
                title="Структуры данных",
                description="Основные структуры данных",
                order=2
            )
            session.add(module2)
            await session.flush()
            
            materials = [
                Material(module_id=module2.id, title="Массивы и списки", 
                        type="text", content_text="Массивы - это упорядоченные коллекции элементов...", order=1),
                Material(module_id=module2.id, title="Стеки и очереди", 
                        type="video", content_url="https://example.com/video/stack-queue.mp4", order=2),
            ]
            for m in materials:
                session.add(m)
    
    await session.commit()
    print("Модули и материалы созданы")


async def create_assignments(session: AsyncSession, courses: list[Course]):
    """Создает задания для курсов"""
    now = datetime.now(timezone.utc)
    
    for course in courses:
        if course.title == "Python для начинающих":
            assignments = [
                Assignment(
                    course_id=course.id,
                    title="Домашнее задание 1: Первая программа",
                    description="Создайте программу, которая выводит 'Привет, мир!' и ваше имя. Программа должна запрашивать имя пользователя.",
                    max_score=10.0,
                    deadline=now + timedelta(days=7)
                ),
                Assignment(
                    course_id=course.id,
                    title="Домашнее задание 2: Работа с переменными",
                    description="Напишите программу для вычисления площади прямоугольника. Программа должна запрашивать длину и ширину.",
                    max_score=15.0,
                    deadline=now + timedelta(days=14)
                ),
                Assignment(
                    course_id=course.id,
                    title="Домашнее задание 3: Работа со списками",
                    description="Создайте программу, которая работает со списком чисел: находит максимум, минимум и среднее значение.",
                    max_score=20.0,
                    deadline=now + timedelta(days=21)
                ),
                Assignment(
                    course_id=course.id,
                    title="Домашнее задание 4: Условия и циклы",
                    description="Напишите программу-калькулятор с использованием условий и циклов. Поддержите операции: +, -, *, /",
                    max_score=25.0,
                    deadline=now + timedelta(days=28)
                ),
            ]
            for a in assignments:
                session.add(a)
            
        elif course.title == "Веб-разработка на FastAPI":
            assignments = [
                Assignment(
                    course_id=course.id,
                    title="Домашнее задание 1: Простое API",
                    description="Создайте простое API с 3 endpoints: GET /items, POST /items, GET /items/{id}",
                    max_score=20.0,
                    deadline=now + timedelta(days=10)
                ),
                Assignment(
                    course_id=course.id,
                    title="Домашнее задание 2: Работа с базой данных",
                    description="Интегрируйте SQLAlchemy в FastAPI приложение. Создайте CRUD операции для модели User.",
                    max_score=30.0,
                    deadline=now + timedelta(days=20)
                ),
            ]
            for a in assignments:
                session.add(a)
            
        elif course.title == "Алгоритмы и структуры данных":
            assignments = [
                Assignment(
                    course_id=course.id,
                    title="Домашнее задание 1: Реализация стека",
                    description="Реализуйте структуру данных 'стек' на Python с методами push, pop, peek, is_empty",
                    max_score=25.0,
                    deadline=now + timedelta(days=12)
                ),
                Assignment(
                    course_id=course.id,
                    title="Домашнее задание 2: Реализация очереди",
                    description="Реализуйте структуру данных 'очередь' на Python. Поддержите операции enqueue и dequeue",
                    max_score=25.0,
                    deadline=now + timedelta(days=24)
                ),
                Assignment(
                    course_id=course.id,
                    title="Домашнее задание 3: Сортировки",
                    description="Реализуйте алгоритмы сортировки: пузырьковая, быстрая и сортировка слиянием",
                    max_score=30.0,
                    deadline=now + timedelta(days=35)
                ),
            ]
            for a in assignments:
                session.add(a)
    
    await session.commit()
    print("Задания созданы")


async def create_tests(session: AsyncSession, courses: list[Course]):
    """Создает тесты для курсов"""
    now = datetime.now(timezone.utc)
    
    for course in courses:
        if course.title == "Python для начинающих":
            test1 = Test(
                course_id=course.id,
                title="Тест 1: Основы Python",
                description="Проверка знаний основ Python: синтаксис, переменные, типы данных",
                max_attempts=3,
                time_limit_minutes=30,
                deadline=now + timedelta(days=21)
            )
            session.add(test1)
            await session.flush()
            
            questions = [
                TestQuestion(
                    test_id=test1.id,
                    question_text="Что выведет код: print(2 + 3 * 2)?",
                    options={"options": ["10", "8", "12", "7"], "correct": 1},
                    order=1,
                    points=2.0
                ),
                TestQuestion(
                    test_id=test1.id,
                    question_text="Какой тип данных у значения 'Hello'?",
                    options={"options": ["int", "str", "float", "bool"], "correct": 1},
                    order=2,
                    points=2.0
                ),
                TestQuestion(
                    test_id=test1.id,
                    question_text="Как получить длину списка в Python?",
                    options={"options": ["list.length()", "len(list)", "list.size()", "length(list)"], "correct": 1},
                    order=3,
                    points=2.0
                ),
                TestQuestion(
                    test_id=test1.id,
                    question_text="Что такое список (list) в Python?",
                    options={"options": ["Неизменяемая последовательность", "Изменяемая последовательность", "Словарь", "Множество"], "correct": 1},
                    order=4,
                    points=2.0
                ),
            ]
            for q in questions:
                session.add(q)
            
            # Тест 2
            test2 = Test(
                course_id=course.id,
                title="Тест 2: Условия и циклы",
                description="Проверка знаний условных операторов и циклов",
                max_attempts=2,
                time_limit_minutes=25,
                deadline=now + timedelta(days=35)
            )
            session.add(test2)
            await session.flush()
            
            questions = [
                TestQuestion(
                    test_id=test2.id,
                    question_text="Какой оператор используется для проверки равенства в Python?",
                    options={"options": ["=", "==", "===", "equals"], "correct": 1},
                    order=1,
                    points=2.0
                ),
                TestQuestion(
                    test_id=test2.id,
                    question_text="Сколько раз выполнится цикл: for i in range(5)?",
                    options={"options": ["4", "5", "6", "0"], "correct": 1},
                    order=2,
                    points=2.0
                ),
            ]
            for q in questions:
                session.add(q)
            
        elif course.title == "Веб-разработка на FastAPI":
            test1 = Test(
                course_id=course.id,
                title="Тест 1: Основы FastAPI",
                description="Проверка знаний FastAPI: роутинг, параметры, запросы",
                max_attempts=2,
                time_limit_minutes=45,
                deadline=now + timedelta(days=30)
            )
            session.add(test1)
            await session.flush()
            
            questions = [
                TestQuestion(
                    test_id=test1.id,
                    question_text="Какой декоратор используется для создания GET endpoint в FastAPI?",
                    options={"options": ["@app.get", "@get", "@route", "@endpoint"], "correct": 0},
                    order=1,
                    points=3.0
                ),
                TestQuestion(
                    test_id=test1.id,
                    question_text="Как получить параметр пути в FastAPI?",
                    options={"options": ["Через request.args", "Через параметр функции", "Через request.params", "Через request.path"], "correct": 1},
                    order=2,
                    points=3.0
                ),
                TestQuestion(
                    test_id=test1.id,
                    question_text="Что такое Pydantic в контексте FastAPI?",
                    options={"options": ["ORM библиотека", "Библиотека для валидации данных", "Веб-сервер", "База данных"], "correct": 1},
                    order=3,
                    points=3.0
                ),
            ]
            for q in questions:
                session.add(q)
            
        elif course.title == "Алгоритмы и структуры данных":
            test1 = Test(
                course_id=course.id,
                title="Тест 1: Структуры данных",
                description="Проверка знаний основных структур данных",
                max_attempts=2,
                time_limit_minutes=40,
                deadline=now + timedelta(days=25)
            )
            session.add(test1)
            await session.flush()
            
            questions = [
                TestQuestion(
                    test_id=test1.id,
                    question_text="Какой принцип работы у стека (LIFO)?",
                    options={"options": ["First In First Out", "Last In First Out", "Random Access", "Sequential Access"], "correct": 1},
                    order=1,
                    points=3.0
                ),
                TestQuestion(
                    test_id=test1.id,
                    question_text="Какой принцип работы у очереди (FIFO)?",
                    options={"options": ["First In First Out", "Last In First Out", "Random Access", "Sequential Access"], "correct": 0},
                    order=2,
                    points=3.0
                ),
            ]
            for q in questions:
                session.add(q)
    
    await session.commit()
    print("Тесты созданы")


async def create_chat_channels(session: AsyncSession, courses: list[Course], students: list[User], teacher: User):
    """Создает каналы чата для курсов и добавляет сообщения"""
    now = datetime.now(timezone.utc)
    
    for course in courses:
        # Общий канал курса
        result = await session.execute(
            select(ChatChannel).where(ChatChannel.course_id == course.id, ChatChannel.name.like(f"%Общий чат%"))
        )
        channel1 = result.scalar_one_or_none()
        
        if not channel1:
            channel1 = ChatChannel(
                course_id=course.id,
                name=f"Общий чат - {course.title}",
                description="Обсуждение вопросов по курсу"
            )
            session.add(channel1)
            await session.flush()
            
            # Добавляем приветственное сообщение от учителя
            if teacher:
                message1 = Message(
                    channel_id=channel1.id,
                    sender_id=teacher.id,
                    content=f"Добро пожаловать на курс '{course.title}'! Задавайте вопросы здесь.",
                    created_at=now - timedelta(days=5)
                )
                session.add(message1)
            
            # Сообщение от ученика
            if students:
                message2 = Message(
                    channel_id=channel1.id,
                    sender_id=students[0].id,
                    content="Спасибо! У меня есть вопрос по первому модулю.",
                    created_at=now - timedelta(days=4)
                )
                session.add(message2)
        
        # Канал для вопросов по ДЗ
        result = await session.execute(
            select(ChatChannel).where(ChatChannel.course_id == course.id, ChatChannel.name.like(f"%Вопросы по ДЗ%"))
        )
        channel2 = result.scalar_one_or_none()
        
        if not channel2:
            channel2 = ChatChannel(
                course_id=course.id,
                name=f"Вопросы по ДЗ - {course.title}",
                description="Задавайте вопросы по домашним заданиям"
            )
            session.add(channel2)
            await session.flush()
            
            if teacher:
                message3 = Message(
                    channel_id=channel2.id,
                    sender_id=teacher.id,
                    content="В этом канале можно задавать вопросы по домашним заданиям.",
                    created_at=now - timedelta(days=3)
                )
                session.add(message3)
    
    await session.commit()
    print("Каналы чата созданы")


async def create_submissions(session: AsyncSession, students: list[User], courses: list[Course]):
    """Создает примеры отправленных заданий"""
    result = await session.execute(select(Assignment))
    assignments = result.scalars().all()
    
    if not assignments or not students:
        return
    
    now = datetime.now(timezone.utc)
    
    # Первый ученик отправляет несколько заданий
    student1 = students[0]
    if len(assignments) > 0:
        assignment1 = assignments[0]
        result = await session.execute(
            select(Submission).where(
                Submission.assignment_id == assignment1.id,
                Submission.student_id == student1.id
            )
        )
        if not result.scalar_one_or_none():
            submission1 = Submission(
                assignment_id=assignment1.id,
                student_id=student1.id,
                comment="Выполнил задание, проверьте пожалуйста",
                status="submitted",
                submitted_at=now - timedelta(days=2)
            )
            session.add(submission1)
            await session.flush()
            
            file1 = SubmissionFile(
                submission_id=submission1.id,
                file_url="/uploads/submission1.py",
                file_name="homework1.py",
                file_size=1024
            )
            session.add(file1)
    
    # Второй ученик отправляет задание с оценкой
    if len(students) > 1 and len(assignments) > 1:
        student2 = students[1]
        assignment2 = assignments[1]
        result = await session.execute(
            select(Submission).where(
                Submission.assignment_id == assignment2.id,
                Submission.student_id == student2.id
            )
        )
        if not result.scalar_one_or_none():
            submission2 = Submission(
                assignment_id=assignment2.id,
                student_id=student2.id,
                comment="Готово к проверке",
                status="graded",
                score=18.0,
                teacher_comment="Хорошая работа, но есть замечания по стилю кода",
                submitted_at=now - timedelta(days=5),
                graded_at=now - timedelta(days=3)
            )
            session.add(submission2)
            await session.flush()
            
            file2 = SubmissionFile(
                submission_id=submission2.id,
                file_url="/uploads/submission2.py",
                file_name="homework2.py",
                file_size=2048
            )
            session.add(file2)
    
    await session.commit()
    print("Примеры отправок созданы")


async def create_notifications(session: AsyncSession, students: list[User], courses: list[Course]):
    """Создает уведомления для учеников"""
    result = await session.execute(select(Assignment))
    assignments = result.scalars().all()
    result = await session.execute(select(Test))
    tests = result.scalars().all()
    
    now = datetime.now(timezone.utc)
    
    # Уведомления для первого ученика
    if students and assignments:
        student1 = students[0]
        
        # Напоминание о дедлайне
        if len(assignments) > 0:
            assignment = assignments[0]
            notification1 = Notification(
                user_id=student1.id,
                type="deadline_reminder",
                title="Напоминание о дедлайне",
                message=f"Напоминаем, что дедлайн по заданию '{assignment.title}' через 3 дня",
                is_read=False,
                created_at=now - timedelta(hours=2),
                metadata={"assignment_id": str(assignment.id), "course_id": str(assignment.course_id)}
            )
            session.add(notification1)
        
        # Уведомление об оценке
        if len(assignments) > 1:
            assignment2 = assignments[1]
            notification2 = Notification(
                user_id=student1.id,
                type="assignment_graded",
                title="Задание оценено",
                message=f"Ваше задание '{assignment2.title}' было оценено на 18 из 20 баллов",
                is_read=False,
                created_at=now - timedelta(days=1),
                metadata={"assignment_id": str(assignment2.id)}
            )
            session.add(notification2)
        
        # Уведомление о новом комментарии
        notification3 = Notification(
            user_id=student1.id,
            type="comment_added",
            title="Новый комментарий",
            message="Преподаватель оставил комментарий к вашему заданию",
            is_read=True,
            created_at=now - timedelta(days=2),
            metadata={"assignment_id": str(assignments[0].id) if assignments else None}
        )
        session.add(notification3)
    
    # Уведомления для второго ученика
    if len(students) > 1 and tests:
        student2 = students[1]
        test = tests[0]
        
        notification4 = Notification(
            user_id=student2.id,
            type="deadline_reminder",
            title="Напоминание о тесте",
            message=f"Напоминаем, что дедлайн по тесту '{test.title}' через 5 дней",
            is_read=False,
            created_at=now - timedelta(hours=1),
            metadata={"test_id": str(test.id), "course_id": str(test.course_id)}
        )
        session.add(notification4)
        
        notification5 = Notification(
            user_id=student2.id,
            type="course_announcement",
            title="Объявление по курсу",
            message="Добавлены новые материалы в модуль 'Введение в Python'",
            is_read=False,
            created_at=now - timedelta(days=1),
            metadata={"course_id": str(test.course_id)}
        )
        session.add(notification5)
    
    # Уведомления для третьего ученика
    if len(students) > 2:
        student3 = students[2]
        
        notification6 = Notification(
            user_id=student3.id,
            type="test_graded",
            title="Тест оценен",
            message="Ваш тест 'Основы Python' был оценен. Результат: 8 из 10 баллов",
            is_read=False,
            created_at=now - timedelta(hours=3),
            metadata={"test_id": str(tests[0].id) if tests else None}
        )
        session.add(notification6)
    
    await session.commit()
    print("Уведомления созданы")


async def create_material_progress(session: AsyncSession, students: list[User], courses: list[Course]):
    """Создает прогресс изучения материалов для учеников"""
    for course in courses:
        result = await session.execute(
            select(Module).where(Module.course_id == course.id).order_by(Module.order)
        )
        modules = result.scalars().all()
        
        for module in modules:
            result = await session.execute(
                select(Material).where(Material.module_id == module.id).order_by(Material.order)
            )
            materials = result.scalars().all()
            
            for i, student in enumerate(students):
                for j, material in enumerate(materials):
                    # Проверяем, есть ли уже прогресс
                    result = await session.execute(
                        select(MaterialProgress).where(
                            MaterialProgress.student_id == student.id,
                            MaterialProgress.material_id == material.id
                        )
                    )
                    existing = result.scalar_one_or_none()
                    
                    if not existing:
                        # Первый ученик прошел больше материалов
                        if i == 0:
                            progress_percent = min(100.0, (j + 1) * 30.0)
                            is_completed = j < len(materials) - 1
                        # Второй ученик прошел половину
                        elif i == 1:
                            progress_percent = min(100.0, (j + 1) * 20.0) if j < len(materials) // 2 else 0.0
                            is_completed = False
                        # Третий ученик только начал
                        else:
                            progress_percent = 10.0 if j == 0 else 0.0
                            is_completed = False
                        
                        progress = MaterialProgress(
                            student_id=student.id,
                            material_id=material.id,
                            progress_percent=progress_percent,
                            is_completed=is_completed
                        )
                        session.add(progress)
    
    await session.commit()
    print("Прогресс по материалам создан")


async def init_test_data():
    """Основная функция инициализации тестовых данных"""
    async with AsyncSessionLocal() as session:
        try:
            print("Начинаем инициализацию тестовых данных...")
            
            # Создаем пользователей
            teacher = await create_test_users(session)
            if not teacher:
                print("Не удалось создать учителя, возможно данные уже существуют")
                return
            
            result = await session.execute(select(User).where(User.role == "student"))
            students = list(result.scalars().all())
            
            # Создаем курсы
            courses = await create_test_courses(session, teacher)
            if not courses:
                result = await session.execute(select(Course))
                courses = list(result.scalars().all())
            
            # Зачисляем учеников на курсы
            await enroll_students_in_courses(session, students, courses)
            
            # Создаем модули и материалы
            await create_modules_and_materials(session, courses)
            
            # Создаем задания
            await create_assignments(session, courses)
            
            # Создаем тесты
            await create_tests(session, courses)
            
            # Создаем каналы чата
            await create_chat_channels(session, courses, students, teacher)
            
            # Создаем примеры отправок
            await create_submissions(session, students, courses)
            
            # Создаем уведомления
            await create_notifications(session, students, courses)
            
            # Создаем прогресс по материалам
            await create_material_progress(session, students, courses)
            
            print("Инициализация тестовых данных завершена успешно!")
            
        except Exception as e:
            print(f"Ошибка при инициализации данных: {e}")
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(init_test_data())

