# UserService
__store__ - метод сохранения нового пользователя
```php
    public function store(UserStoreDTO $userStoreDTO)
    {
        return $this->userRepository->store($userStoreDTO);
    }
```
