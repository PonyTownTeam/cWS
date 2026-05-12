#ifndef BACKEND_H
#define BACKEND_H

#if defined(__linux__)
	#ifndef USE_EPOLL
		#define USE_EPOLL
	#endif
	#include "Epoll.h"
#else
	#include "Libuv.h"
#endif

#endif // BACKEND_H
